const CACHE_NAME = 'alley33-card-v1';
// Aggiungi qui i file principali della tua app che vuoi rendere disponibili offline.
const urlsToCache = [
  './app.html',
  'https://www.alley33.it/cdn/shop/files/ALLEY33_def_bianco.png?v=1678978536&width=500',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Evento di installazione: viene eseguito quando il service worker viene installato.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento fetch: intercetta tutte le richieste di rete.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se la risorsa è in cache, la restituisce.
        if (response) {
          return response;
        }
        // Altrimenti, la richiede dalla rete.
        return fetch(event.request);
      })
  );
});
