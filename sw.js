// Aumenta la versione della cache per forzare l'aggiornamento
const CACHE_NAME = 'alley33-card-v2'; 
const urlsToCache = [
  './app.html',
  'https://www.alley33.it/cdn/shop/files/ALLEY33_def_bianco.png?v=1678978536&width=500',
  './Logo_Alley_nero.png', // Aggiunto il nuovo logo alla cache
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
  );
});

// NUOVO: Evento di attivazione per pulire le vecchie cache
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
    })
  );
});


// Evento fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
