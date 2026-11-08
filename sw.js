const CACHE_NAME = "troxonomika-final-v19";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

// Εγκατάσταση: Αποθήκευση των αρχείων στην κρυφή μνήμη
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Ενεργοποίηση: Διαγραφή παλιών εκδόσεων (Cache)
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Διαχείριση Δικτύου (Fetch)
self.addEventListener("fetch", event => {
  const request = event.request;
  
  // Δεν διαχειριζόμαστε μη-GET αιτήματα
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  
  // Αγνοούμε εξωτερικά domains (π.χ. Google Fonts αν χρησιμοποιούσαμε)
  if (url.origin !== self.location.origin) return;

  // Στρατηγική: Network-first για HTML (για να βλέπεις πάντα την τελευταία έκδοση)
  if (request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  // Στρατηγική: Cache-first για CSS, JS, Icons (για να φορτώνει ακαριαία offline)
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      
      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});