/* troxonomika - ocr-scan.js
 * Αποκλειστικά τοπικό OCR. Δεν αποστέλλεται εικόνα ή κείμενο σε server/API.
 * OcrScan.run(file, onStatus) -> Promise<string>
 */
(function (root) {
  'use strict';
  const MAXSIDE = 3000;
  const base = () => new URL('./tess/', root.location.href).href;

  function integral(gray, w, h) {
    const stride = w + 1, I = new Uint32Array(stride * (h + 1));
    for (let y = 0; y < h; y++) {
      let row = 0;
      for (let x = 0; x < w; x++) {
        row += gray[y * w + x];
        I[(y + 1) * stride + x + 1] = I[y * stride + x + 1] + row;
      }
    }
    return I;
  }
  function boxMean(I, w, h, radius, x, y) {
    const s = w + 1, x0 = Math.max(0, x - radius), x1 = Math.min(w, x + radius + 1);
    const y0 = Math.max(0, y - radius), y1 = Math.min(h, y + radius + 1);
    const sum = I[y1 * s + x1] - I[y0 * s + x1] - I[y1 * s + x0] + I[y0 * s + x0];
    return sum / ((x1 - x0) * (y1 - y0));
  }
  function percentile(gray, p) {
    const hist = new Uint32Array(256);
    for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
    const target = Math.floor(gray.length * p); let sum = 0;
    for (let i = 0; i < 256; i++) { sum += hist[i]; if (sum >= target) return i; }
    return 255;
  }
  function makeCanvas(gray, w, h, mode) {
    const c = root.document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const id = ctx.createImageData(w, h), d = id.data;
    let out = gray;
    if (mode === 'contrast') {
      const lo = percentile(gray, .015), hi = percentile(gray, .985), range = Math.max(1, hi - lo);
      out = new Uint8Array(gray.length);
      for (let i = 0; i < gray.length; i++) out[i] = Math.max(0, Math.min(255, Math.round((gray[i] - lo) * 255 / range)));
    } else if (mode === 'flatten') {
      const I = integral(gray, w, h), radius = Math.max(24, Math.round(Math.min(w, h) / 32));
      out = new Uint8Array(gray.length);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const mean = boxMean(I, w, h, radius, x, y) || 1;
        const v = gray[y * w + x] / mean;
        out[y * w + x] = Math.max(0, Math.min(255, Math.round((v - .58) * 255 / (.94 - .58))));
      }
    } else if (mode === 'adaptive') {
      const I = integral(gray, w, h), radius = Math.max(18, Math.round(Math.min(w, h) / 48));
      out = new Uint8Array(gray.length);
      // Τοπικό κατώφλι: αν το pixel είναι αρκετά πιο σκούρο από το γύρω υπόβαθρο, γίνεται μαύρο.
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, mean = boxMean(I, w, h, radius, x, y);
        out[i] = gray[i] < mean - 12 ? 0 : 255;
      }
    }
    for (let i = 0, j = 0; i < out.length; i++, j += 4) d[j] = d[j + 1] = d[j + 2] = out[i], d[j + 3] = 255;
    ctx.putImageData(id, 0, 0); return c;
  }
  async function decode(file) {
    if (root.createImageBitmap) { try { return await root.createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { return await root.createImageBitmap(file); } }
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
      im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Δεν ανοίγει η φωτογραφία.')); };
      im.src = url;
    });
  }
  async function imageVariants(file) {
    const src = await decode(file), sw = src.width, sh = src.height;
    if (!sw || !sh) { if (src.close) src.close(); throw new Error('Η εικόνα δεν έχει έγκυρες διαστάσεις.'); }
    const scale = Math.min(1, MAXSIDE / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * scale)), h = Math.max(1, Math.round(sh * scale));
    const baseCanvas = root.document.createElement('canvas'); baseCanvas.width = w; baseCanvas.height = h;
    const ctx = baseCanvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(src, 0, 0, w, h); if (src.close) src.close();
    const d = ctx.getImageData(0, 0, w, h).data, gray = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) gray[j] = Math.round((d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000);
    baseCanvas.width = baseCanvas.height = 1; // απελευθέρωση της αρχικής canvas μετά την εξαγωγή grayscale
    return { gray, w, h, variants: [
      { name: 'κανονική αντίθεση', mode: 'contrast', psm: '6' },
      { name: 'εξομάλυνση φωτισμού', mode: 'flatten', psm: '6' },
      { name: 'τοπική ασπρόμαυρη μετατροπή', mode: 'adaptive', psm: '11' }
    ] };
  }
  const loadScript = (src) => new Promise((res, rej) => {
    const s = root.document.createElement('script'); s.src = src;
    s.onload = res; s.onerror = () => rej(new Error('Δεν φορτώθηκε το τοπικό αρχείο OCR: ' + src.split('/').pop()));
    root.document.head.appendChild(s);
  });
  const simdOK = () => {
    try { return WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])); }
    catch (_) { return false; }
  };
  function score(text, confidence) {
    const t = String(text || '').trim();
    if (!t) return -100;
    const greek = (t.match(/[Α-Ωα-ωΆΈΉΊΌΎΏΪΫάέήίόύώϊϋ]/g) || []).length;
    const digits = (t.match(/\d/g) || []).length;
    const words = t.split(/\s+/).filter(x => x.length >= 2).length;
    const anchors = ['αστυνομ', 'τροχαι', 'παραβα', 'οδηγ', 'αφαιρε', 'πρωτοκολλ', 'ιδιοκτη', 'ημερομην', 'ταχυτητα'].filter(a => t.toLowerCase().includes(a)).length;
    const structural = Math.min(25, words * .22) + Math.min(12, digits * .35) + anchors * 4 + Math.min(18, greek / Math.max(1, t.length) * 60);
    return (Number.isFinite(confidence) ? confidence : 0) * .65 + structural;
  }
  async function checkOffline() {
    const required = ['tesseract.min.js', 'worker.min.js', simdOK() ? 'tesseract-core-simd-lstm.wasm.js' : 'tesseract-core-lstm.wasm.js', 'lang/ell.traineddata.gz'];
    const missing = [];
    if (!root.caches || !root.caches.match) return { supported: false, ready: false, missing: required };
    for (const path of required) {
      const url = new URL(path, base()).href;
      try { if (!await root.caches.match(url)) missing.push(path); } catch (_) { missing.push(path); }
    }
    return { supported: true, ready: missing.length === 0, missing };
  }
  async function run(file, onStatus) {
    const say = typeof onStatus === 'function' ? onStatus : () => {};
    if (!file || !/^image\//i.test(file.type || '')) throw new Error('Επίλεξε αρχείο εικόνας.');
    say('Προετοιμασία εικόνας στη συσκευή…');
    const prepared = await imageVariants(file), B = base();
    if (!root.Tesseract) { say('Φόρτωση τοπικού OCR…'); await loadScript(B + 'tesseract.min.js'); }
    say('Εκκίνηση τοπικού OCR (ελληνικά)…');
    const worker = await root.Tesseract.createWorker('ell', 1, {
      workerPath: B + 'worker.min.js',
      corePath: B + (simdOK() ? 'tesseract-core-simd-lstm.wasm.js' : 'tesseract-core-lstm.wasm.js'),
      langPath: B + 'lang/', workerBlobURL: false,
      logger: (m) => { if (m && m.status === 'recognizing text') say('Τοπική αναγνώριση… ' + Math.round((m.progress || 0) * 100) + '%');
                    else if (m && m.status === 'loading language traineddata') say('Φόρτωση ελληνικού μοντέλου…'); }
    });
    let best = { text: '', score: -1 }, results = [];
    try {
      for (let i = 0; i < prepared.variants.length; i++) {
        const v = prepared.variants[i];
        say(`Δοκιμή ${i + 1}/${prepared.variants.length}: ${v.name}…`);
        const canvas = makeCanvas(prepared.gray, prepared.w, prepared.h, v.mode);
        try {
          await worker.setParameters({ tessedit_pageseg_mode: v.psm, preserve_interword_spaces: '1' });
          const r = await worker.recognize(canvas), text = r && r.data ? r.data.text || '' : '', conf = r && r.data ? r.data.confidence : 0;
          const s = score(text, conf); results.push({ text, confidence: conf, score: s });
          if (s > best.score) best = { text, score: s };
        } finally { canvas.width = canvas.height = 1; }
      }
      // Αν η καλύτερη εκδοχή είναι ουσιαστικά κενή, επιστρέφουμε την πιο μακρά μη κενή για διάγνωση.
      if (!best.text.trim()) best = results.sort((a, b) => b.text.length - a.text.length)[0] || best;
      const cleaned = String(best.text || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
      say(cleaned.length ? `OCR ολοκληρώθηκε (${cleaned.length} χαρακτήρες). Έλεγξε τα στοιχεία που συμπληρώθηκαν.` : 'Δεν διαβάστηκε κείμενο. Δοκίμασε φωτογραφία πιο καθαρή, κάθετη και με περισσότερο φως.');
      return cleaned;
    } finally { try { await worker.terminate(); } catch (_) {} }
  }
  root.OcrScan = { run, checkOffline };
})(typeof self !== 'undefined' ? self : this);
