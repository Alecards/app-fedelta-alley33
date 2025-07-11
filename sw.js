// Aumentata la versione della cache per forzare l'aggiornamento
const CACHE_NAME = 'alley33-card-v5'; 
const urlsToCache = [
  './', // Cache della pagina principale
  './app.html',
  './manifest.json', // Aggiunto il manifest alla cache
  './Logo_Alley_nero.png',
  './Logo_Alley_bianco.png',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Evento di installazione: il service worker si installa
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta e file aggiunti');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione del nuovo SW
  );
});

// Evento di attivazione: il service worker prende il controllo
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
    }).then(() => self.clients.claim()) // Prende il controllo di tutte le schede aperte
  );
});

// Evento fetch: strategia "Cache first, then network"
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se la risorsa è in cache, la restituisce.
        // Altrimenti, la richiede dalla rete.
        return response || fetch(event.request);
      })
  );
});
