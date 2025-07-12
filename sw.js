// Aumentata la versione della cache per forzare l'aggiornamento
const CACHE_NAME = 'alley33-card-v13'; 
const urlsToCache = [
  './', 
  './index.html',
  './manifest.json',
  './Logo_Alley_nero.png',
  './Logo_Alley_bianco.png',
  './icon-192x192.png',
  './icon-512x512.png'
];

// Importa gli script di Firebase
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js");

// Inizializza Firebase nel Service Worker
const firebaseConfig = {
    apiKey: "AIzaSyANwokA9yGsphGB6sjLwga4s8jHr1Z1gvY",
    authDomain: "alley33-card-v2.firebaseapp.com",
    projectId: "alley33-card-v2",
    storageBucket: "alley33-card-v2.appspot.com",
    messagingSenderId: "892370144503",
    appId: "1:892370144503:web:a4aab865883cb3c50f17f2"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Gestisce le notifiche in background
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Ricevuto messaggio in background. ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
