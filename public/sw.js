// public/sw.js

const CACHE_NAME = 'titik-nol-pos-v3'; // Naikkan versi cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png' // Disesuaikan dengan ikon yang ada di index.html
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan cegat request non-GET atau request pengembangan Vite / Google Apps Script
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.hostname.includes('script.google.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1. Jika sudah ada di cache, kembalikan langsung dari cache
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2. Jika tidak ada di cache, ambil dari jaringan (network)
      return fetch(event.request)
        .then((networkResponse) => {
          // Hanya cache respon yang valid (HTTP status 200)
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Simpan otomatis berkas JS/CSS/Gambar baru hasil build Vite ke cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // 3. Fallback jika offline dan request berupa navigasi halaman
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});