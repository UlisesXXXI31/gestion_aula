const CACHE_NAME = "Gestionapp-page-v1";
const OFFLINE_URL = "/offline.html";

// Cache solo los esenciales para GitHub
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js'
 
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Solo cachear solicitudes GET y del mismo origen
  if (event.request.method !== 'GET' || 
      !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devolver cache si existe
        if (response) {
          return response;
        }

        // Hacer fetch y cachear
        return fetch(event.request).then(response => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Para navegación, devolver offline
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});
