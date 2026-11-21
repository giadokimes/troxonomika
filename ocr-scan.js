/* troxonomika - ocr-scan.js v2
   OcrScan.run(αρχείοΕικόνας, onStatus) -> Promise<κείμενο>
   Με OpenCV.js pre-processing (document detection + perspective correction + adaptive threshold).
   Αν το OpenCV αποτύχει, πέφτει σε απλό grayscale fallback.
   Όλη η επεξεργασία γίνεται τοπικά. */
(function (root) {
  'use strict';
  const MAXSIDE = 2400;
  const base = () => new URL('./tess/', root.location.href).href;

  const loadImg = (file) => new Promise((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); res(im); };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Δεν άνοιξε η εικόνα')); };
    im.src = u;
  });

  async function sourceCanvas(file) {
    const src = root.createImageBitmap
      ? await root.createImageBitmap(file)
      : await loadImg(file);
    const sw = src.width, sh = src.height;
    const scale = Math.min(1, MAXSIDE / Math.max(sw, sh));
    const canvas = root.document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw * scale));
    canvas.height = Math.max(1, Math.round(sh * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(src, 0, 0, canvas.width, canvas.height);
    if (src.close) src.close();
    return canvas;
  }

  // Fallback: απλό grayscale/contrast (αν το OpenCV αποτύχει)
  function grayVariant(source, contrast) {
    const cv = root.document.createElement('canvas');
    cv.width = source.width; cv.height = source.height;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    const id = ctx.getImageData(0, 0, cv.width, cv.height), d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      let v = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
      if (contrast) v = Math.max(0, Math.min(255, (v - 128) * 1.22 + 128));
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  function cropCanvas(source, x, y, width, height, maxSide) {
    const sx = Math.max(0, Math.round(source.width * x));
    const sy = Math.max(0, Math.round(source.height * y));
    const sw = Math.max(1, Math.min(source.width - sx, Math.round(source.width * width)));
    const sh = Math.max(1, Math.min(source.height - sy, Math.round(source.height * height)));
    const scale = Math.min(2.2, maxSide / Math.max(sw, sh));
    const cv = root.document.createElement('canvas');
    cv.width = Math.max(1, Math.round(sw * scale));
    cv.height = Math.max(1, Math.round(sh * scale));
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, cv.width, cv.height);
    return cv;
  }

  // Load OpenCV.js lazily
  async function loadOpenCV() {
    if (root.cv && root.cv.Mat) return true;
    return new Promise((res) => {
      const s = root.document.createElement('script');
      s.src = base() + 'opencv.js';
      s.onload = () => res(root.cv && root.cv.Mat);
      s.onerror = () => res(false);
      root.document.head.appendChild(s);
    });
  }

  // Εντοπισμός 4 γωνιών (top-left, top-right, bottom-right, bottom-left)
  function sortCorners(pts) {
    const withStats = pts.map(p => ({
      p,
      sum: p.x + p.y,
      diff: p.y - p.x
    }));
    // top-left: min sum, bottom-right: max sum
    const bySum = withStats.slice().sort((a, b) => a.sum - b.sum);
    const tl = bySum[0].p, br = bySum[3].p;
    // top-right: min diff, bottom-left: max diff
    const byDiff = withStats.slice().sort((a, b) => a.diff - b.diff);
    const tr = byDiff[0].p, bl = byDiff[3].p;
    return [tl, tr, br, bl];
  }

  // OpenCV pipeline: detect document → perspective warp → adaptive threshold
  async function processWithOpenCV(source) {
    const cv = root.cv;
    const src = cv.imread(source);
    const trash = [];
    try {
      // Grayscale
      const gray = new cv.Mat(); trash.push(gray);
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      // Blur
      const blurred = new cv.Mat(); trash.push(blurred);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Canny edges
      const edges = new cv.Mat(); trash.push(edges);
      cv.Canny(blurred, edges, 50, 200);

      // Dilate edges για να κλείσουμε gaps
      const dilated = new cv.Mat(); trash.push(dilated);
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.dilate(edges, dilated, kernel);

      // Find contours
      const contours = new cv.MatVector(); trash.push(contours);
      const hierarchy = new cv.Mat(); trash.push(hierarchy);
      cv.findContours(dilated, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      const srcArea = src.rows * src.cols;
      let bestContour = null, bestArea = 0, bestApprox = null;

      for (let i = 0; i < contours.size(); i++) {
        const c = contours.get(i);
        const area = cv.contourArea(c);
        if (area < srcArea * 0.25) continue; // πολύ μικρό, δεν είναι έγγραφο

        const peri = cv.arcLength(c, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(c, approx, 0.02 * peri, true);

        // Ψάχνουμε τετράπλευρο με μεγάλο εμβαδόν
        if (approx.rows === 4 && area > bestArea) {
          bestContour = c;
          bestArea = area;
          if (bestApprox) bestApprox.delete();
          bestApprox = approx.clone();
        } else {
          approx.delete();
        }
      }

      let warped = null;
      if (bestApprox && bestApprox.rows === 4) {
        // Εξαγωγή γωνιών
        const pts = [];
        for (let i = 0; i < 4; i++) {
          pts.push({
            x: bestApprox.data32S[i * 2],
            y: bestApprox.data32S[i * 2 + 1]
          });
        }
        const [tl, tr, br, bl] = sortCorners(pts);

        const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
        const widthBot = Math.hypot(br.x - bl.x, br.y - bl.y);
        const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
        const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);
        const w = Math.round(Math.max(widthTop, widthBot));
        const h = Math.round(Math.max(heightLeft, heightRight));

        const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y
        ]);
        const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0, w, 0, w, h, 0, h
        ]);
        const M = cv.getPerspectiveTransform(srcTri, dstTri);
        warped = new cv.Mat();
        cv.warpPerspective(src, warped, M, new cv.Size(w, h),
          cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255));
        srcTri.delete(); dstTri.delete(); M.delete();
      }

      const input = warped || src.clone();

      // Convert to gray αν έχει χρώμα
      const grayIn = new cv.Mat();
      if (input.channels() === 1) {
        input.copyTo(grayIn);
      } else {
        cv.cvtColor(input, grayIn, cv.COLOR_RGBA2GRAY, 0);
      }

      // Adaptive threshold - εξαφανίζει σκιές, αναδεικνύει γράμματα
      const thresh = new cv.Mat();
      cv.adaptiveThreshold(grayIn, thresh, 255,
        cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 10);

      // Convert σε canvas
      const outCanvas = root.document.createElement('canvas');
      outCanvas.width = thresh.cols;
      outCanvas.height = thresh.rows;
      cv.imshow(outCanvas, thresh);

      // Cleanup
      grayIn.delete();
      thresh.delete();
      if (warped) warped.delete();
      if (bestApprox) bestApprox.delete();
      trash.forEach(m => { try { m.delete(); } catch(e){} });
      src.delete();

      return outCanvas;
    } catch (err) {
      console.warn('OpenCV failed, falling back:', err);
      trash.forEach(m => { try { m.delete(); } catch(e){} });
      try { src.delete(); } catch(e){}
      if (bestApprox) try { bestApprox.delete(); } catch(e){}
      return null;
    }
  }

  const loadScript = (src) => new Promise((res, rej) => {
    const s = root.document.createElement('script');
    s.src = src; s.onload = res;
    s.onerror = () => rej(new Error('Δεν φορτώθηκε το ' + src.split('/').pop()));
    root.document.head.appendChild(s);
  });

  const simdOK = () => {
    try {
      return WebAssembly.validate(new Uint8Array([
        0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,
        3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11
      ]));
    } catch (e) { return false; }
  };

  async function run(file, onStatus) {
    const say = onStatus || (() => {});
    say('Προετοιμασία εικόνας…');

    const original = await sourceCanvas(file);
    const B = base();

    // Προσπάθεια OpenCV pre-processing
    let processed = null;
    try {
      const cvOk = await loadOpenCV();
      if (cvOk) {
        say('Εντοπισμός εγγράφου…');
        processed = await processWithOpenCV(original);
      }
    } catch (err) {
      console.warn('OpenCV pipeline failed:', err);
    }

    // Fallback: grayscale (παλιά λογική)
    if (!processed) {
      say('Χρήση εφεδρικής προεπεξεργασίας…');
      processed = grayVariant(original, false);
    }

    // Φόρτωση Tesseract
    if (!root.Tesseract) {
      say('Φόρτωση OCR…');
      await loadScript(B + 'tesseract.min.js');
    }

    say('Εκκίνηση τοπικού OCR…');

    const worker = await root.Tesseract.createWorker('ell', 1, {
      workerPath: B + 'worker.min.js',
      corePath: B + (simdOK() ? 'tesseract-core-simd-lstm.wasm.js' : 'tesseract-core-lstm.wasm.js'),
      langPath: B + 'lang/',
      workerBlobURL: false,
      logger: (m) => {
        if (m && m.status === 'recognizing text') {
          say('Τοπική ανάγνωση… ' + Math.round((m.progress || 0) * 100) + '%');
        }
      }
    });

    const outputs = [];

    async function pass(label, image, psm) {
      if (worker.setParameters) {
        await worker.setParameters({
          tessedit_pageseg_mode: String(psm),
          preserve_interword_spaces: '1'
        });
      }
      say('Ανάγνωση: ' + label + '…');
      const result = await worker.recognize(image);
      const text = result && result.data ? String(result.data.text || '').trim() : '';
      if (text) outputs.push('\n[' + label + ']\n' + text);
    }

    try {
      // Κύρια passes στην καθαρή εικόνα
      await pass('ΟΛΟΚΛΗΡΗ ΣΕΛΙΔΑ', processed, 3);
      await pass('ΟΛΟΚΛΗΡΗ ΣΕΛΙΔΑ - ΕΝΑΛΛΑΚΤΙΚΗ', processed, 11);

      // Crops για συγκεκριμένες περιοχές (χρησιμοποιούνται από τον parser)
      const header = cropCanvas(processed, 0.02, 0.00, 0.96, 0.38, 2400);
      await pass('ΚΕΦΑΛΙΔΑ ΥΠΗΡΕΣΙΑΣ', header, 6);

      const body = cropCanvas(processed, 0.02, 0.20, 0.96, 0.68, 2800);
      await pass('ΚΥΡΙΑ ΠΑΡΑΓΡΑΦΟΣ', body, 6);
      await pass('ΚΥΡΙΑ ΠΑΡΑΓΡΑΦΟΣ - ΕΝΑΛΛΑΚΤΙΚΗ', body, 11);

      return outputs.join('\n\n');
    } finally {
      try { await worker.terminate(); } catch (e) {}
    }
  }

  root.OcrScan = { run };
})(typeof self !== 'undefined' ? self : this);