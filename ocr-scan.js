/* troxonomika - ocr-scan.js
   OcrScan.run(αρχείοΕικόνας, onStatus) -> Promise<κείμενο>
   Τρέχει εξ ολοκλήρου στη συσκευή (Tesseract.js, αρχεία από τον φάκελο ./tess/).
   Η εικόνα δεν αποθηκεύεται ούτε αποστέλλεται πουθενά. */
(function (root) {
  'use strict';
  const MAXSIDE = 2800;                       // μέγιστη μεγάλη πλευρά σε pixel πριν το OCR
  const base = () => new URL('./tess/', root.location.href).href;

  // Εξομάλυνση φωτισμού: διαιρεί κάθε pixel με τον τοπικό μέσο όρο, ώστε να φεύγουν σκιές και διαβαθμίσεις
  function flattenGray(g, w, h, r, lo, hi) {
    const W1 = w + 1, I = new Float64Array(W1 * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) { row += g[y * w + x]; I[(y + 1) * W1 + x + 1] = I[y * W1 + x + 1] + row; }
    }
    const out = new Uint8ClampedArray(w * h), k = 255 / (hi - lo);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
        const sum = I[y1 * W1 + x1] - I[y0 * W1 + x1] - I[y1 * W1 + x0] + I[y0 * W1 + x0];
        const mean = sum / ((x1 - x0) * (y1 - y0)) || 1;
        const v = (g[y * w + x] / mean - lo) * k;
        out[y * w + x] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }
    return out;
  }

  const loadImg = (file) => new Promise((res, rej) => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => { URL.revokeObjectURL(u); res(im); };
    im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('Δεν άνοιξε η εικόνα')); };
    im.src = u;
  });

  async function preprocess(file) {
    const src = root.createImageBitmap ? await root.createImageBitmap(file) : await loadImg(file);
    const sw = src.width, sh = src.height, s = Math.min(1, MAXSIDE / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * s)), h = Math.max(1, Math.round(sh * s));
    const cv = root.document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, w, h);
    if (src.close) src.close();
    const id = ctx.getImageData(0, 0, w, h), d = id.data, g = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) g[j] = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    const o = flattenGray(g, w, h, Math.max(20, Math.round(Math.min(w, h) / 40)), 0.55, 0.92);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) { d[i] = d[i + 1] = d[i + 2] = o[j]; d[i + 3] = 255; }
    ctx.putImageData(id, 0, 0);
    return cv;
  }

  const loadScript = (src) => new Promise((res, rej) => {
    const s = root.document.createElement('script');
    s.src = src; s.onload = res; s.onerror = () => rej(new Error('Δεν φορτώθηκε το ' + src.split('/').pop()));
    root.document.head.appendChild(s);
  });
  // Έλεγχος υποστήριξης SIMD (ταχύτερος πυρήνας OCR)
  const simdOK = () => {
    try { return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); }
    catch (e) { return false; }
  };

  async function run(file, onStatus) {
    const say = onStatus || (() => {});
    say('Προετοιμασία εικόνας…');
    const canvas = await preprocess(file);
    const B = base();
    if (!root.Tesseract) { say('Φόρτωση OCR…'); await loadScript(B + 'tesseract.min.js'); }
    say('Εκκίνηση OCR…');
    const worker = await root.Tesseract.createWorker('ell', 1, {
      workerPath: B + 'worker.min.js',
      corePath: B + (simdOK() ? 'tesseract-core-simd-lstm.wasm.js' : 'tesseract-core-lstm.wasm.js'),
      langPath: B + 'lang/',
      workerBlobURL: false,
      logger: (m) => { if (m && m.status === 'recognizing text') say('Ανάγνωση εγγράφου… ' + Math.round((m.progress || 0) * 100) + '%'); }
    });
    try {
      const r = await worker.recognize(canvas);
      return r.data.text || '';
    } finally {
      try { await worker.terminate(); } catch (e) {}
    }
  }

  root.OcrScan = { run, flattenGray };
})(typeof self !== 'undefined' ? self : this);
