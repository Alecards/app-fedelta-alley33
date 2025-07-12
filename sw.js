// Aumentata la versione della cache per forzare l'aggiornamento
const CACHE_NAME = 'alley33-card-v9'; 
const urlsToCache = [
  './', 
  './index.html',
  './manifest.json',
  './Logo_Alley_nero.png',
  './Logo_Alley_bianco.png',
  './icon-192x192.png',
  './icon-512x512.png',
  // URL del video inserita correttamente
  'https://firebasestorage.googleapis.com/v0/b/alley33-card-v2.firebasestorage.app/o/WelcomeVideo.mp4?alt=media&token=881e2ce2-a3f2-448a-aeed-7308ac905b81'
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
