
// SEMANTIC VERSION CACHE - Only invalidates on actual version changes
const APP_VERSION = '1.1.0';
const CACHE_NAME = `gpa-study-hub-v${APP_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gpa_hub_logo.png'
];

// Network-first for API calls, cache-first for static assets
const API_ORIGINS = ['firebaseio.googleapis.com', 'googleapis.com', 'esm.sh'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key.startsWith('gpa-study-hub-v'))
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first strategy for API calls
  if (API_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache, but update in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

/**
 * PUSH NOTIFICATION HANDLING
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'GPA Hub Update',
    body: 'New notification from your campus.',
    icon: '/gpa_hub_logo.png'
  };

  const options = {
    body: data.body,
    icon: data.icon || '/gpa_hub_logo.png',
    badge: '/gpa_hub_logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
