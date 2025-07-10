// Aumenta la versione della cache ogni volta che fai una modifica importante
const CACHE_NAME = 'alley33-card-v3'; 
const urlsToCache = [
  './', // Cache della pagina principale
  './app.html',
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
        // addAll può fallire se anche solo una risorsa non è raggiungibile.
        // Usiamo add per ogni risorsa per un controllo più granulare.
        urlsToCache.forEach(url => {
          cache.add(url).catch(err => console.warn(`Impossibile memorizzare nella cache ${url}: ${err}`));
        });
      })
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
    })
  );
});


// Evento fetch: strategia "Cache first, then network"
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
