/* troxonomika - ocr-scan.js
   OcrScan.run(αρχείοΕικόνας, onStatus) -> Promise<κείμενο>
   Όλη η επεξεργασία γίνεται τοπικά στη συσκευή. Δεν υπάρχει αποστολή εικόνας/κειμένου. */
(function (root) {
  'use strict';
  const MAXSIDE = 3000;
  const base = () => new URL('./tess/', root.location.href).href;

  const loadImg = (file) => new Promise((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); res(im); };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Δεν άνοιξε η εικόνα')); };
    im.src = u;
  });

  async function sourceCanvas(file) {
    const src = root.createImageBitmap ? await root.createImageBitmap(file) : await loadImg(file);
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

  // Ήπια grayscale/contrast εκδοχή. Διατηρούμε και την αρχική εικόνα, επειδή
  // η επιθετική εξομάλυνση μπορεί να σβήσει λεπτές γραμμές ελληνικών χαρακτήρων.
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
    } catch (e) {
      return false;
    }
  };

  async function run(file, onStatus) {
    const say = onStatus || (() => {});
    say('Προετοιμασία εικόνας…');

    const original = await sourceCanvas(file);
    const gray = grayVariant(original, false);
    const contrast = grayVariant(original, true);
    const B = base();

    if (!root.Tesseract) {
      say('Φόρτωση OCR…');
      await loadScript(B + 'tesseract.min.js');
    }

    say('Εκκίνηση τοπικού OCR…');

    const worker = await root.Tesseract.createWorker('ell', 1, {
      workerPath: B + 'worker.min.js',
      corePath: B + (
        simdOK()
          ? 'tesseract-core-simd-lstm.wasm.js'
          : 'tesseract-core-lstm.wasm.js'
      ),
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
      const text = result && result.data
        ? String(result.data.text || '').trim()
        : '';

      if (text) {
        outputs.push('\n[' + label + ']\n' + text);
      }
    }

    try {
      // Ολόκληρη σελίδα: αυτόματη διάταξη και εναλλακτική αραιού κειμένου.
      await pass('ΟΛΟΚΛΗΡΗ ΣΕΛΙΔΑ', gray, 3);
      await pass('ΟΛΟΚΛΗΡΗ ΣΕΛΙΔΑ - ΕΝΑΛΛΑΚΤΙΚΗ', contrast, 11);

      // Κεφαλίδα: η υπηρεσία ανάθεσης βρίσκεται συνήθως στο άνω τμήμα.
      const header = cropCanvas(gray, 0.02, 0.00, 0.96, 0.38, 2400);
      await pass('ΚΕΦΑΛΙΔΑ ΥΠΗΡΕΣΙΑΣ', header, 6);

      // Κύριο σώμα: πινακίδα και ιδιοκτήτης, με δύο διαφορετικές εικόνες.
      const bodyGray = cropCanvas(gray, 0.02, 0.20, 0.96, 0.68, 2800);
      const bodyContrast = cropCanvas(contrast, 0.02, 0.20, 0.96, 0.68, 2800);

      await pass('ΚΥΡΙΑ ΠΑΡΑΓΡΑΦΟΣ', bodyGray, 6);
      await pass('ΚΥΡΙΑ ΠΑΡΑΓΡΑΦΟΣ - ΕΝΑΛΛΑΚΤΙΚΗ', bodyContrast, 11);

      return outputs.join('\n\n');
    } finally {
      try {
        await worker.terminate();
      } catch (e) {}
    }
  }

  root.OcrScan = { run };
})(typeof self !== 'undefined' ? self : this);