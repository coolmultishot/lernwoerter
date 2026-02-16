// Service Worker für Lernwörter PWA
const CACHE_NAME = 'lernwoerter-v1';
const urlsToCache = [
  '/lernwoerter/',
  '/lernwoerter/index.html',
  '/lernwoerter/manifest.json'
];

// Installation - Cache wichtige Dateien
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung - Alte Caches löschen
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Netzwerk zuerst, dann Cache (für aktuelle Lernwörter)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone der Response für Cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      })
      .catch(() => {
        // Wenn Netzwerk fehlt, verwende Cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Fallback für HTML-Seiten
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/lernwoerter/index.html');
          }
        });
      })
  );
});
