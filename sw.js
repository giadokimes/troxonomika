const CACHE = "troxonomika-v67"; // Άλλαξα την έκδοση εδώ για να σπάσει η προηγούμενη μνήμη
const FILES = ["./", "./index.html", "./style.css", "./app.js", "./ocr-parser.js", "./ocr-scan.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];

// Αρχεία OCR (μεγάλα): αποθηκεύονται για χρήση χωρίς σύνδεση, αλλά αν κάποιο λείπει δεν μπλοκάρει την εγκατάσταση
const OCR_FILES = ["./tess/tesseract.min.js", "./tess/worker.min.js", "./tess/tesseract-core-simd-lstm.wasm.js", "./tess/tesseract-core-lstm.wasm.js", "./tess/lang/ell.traineddata.gz"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(u => new Request(u, { cache: "reload" }))))
    .then(() => caches.open(CACHE))
    .then(c => Promise.allSettled(OCR_FILES.map(u => c.add(new Request(u, { cache: "reload" })))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (r.mode === "navigate" || u.pathname.endsWith(".html")) {
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res;
    }).catch(() => caches.match(r).then(h => h || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => {
      if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
