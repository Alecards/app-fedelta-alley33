// Aumentata la versione della cache per forzare l'aggiornamento
const CACHE_NAME = 'alley33-card-v6'; 
const urlsToCache = [
  './', 
  './index.html', // Nome file corretto
  './manifest.json',
  './Logo_Alley_nero.png',
  './Logo_Alley_bianco.png',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Evento di installazione
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta e file aggiunti');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento di attivazione per pulire le vecchie cache
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Cancellazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
