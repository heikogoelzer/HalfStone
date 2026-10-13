const CACHE_NAME = 'halfstone-cache-v3';

// All files the app needs to run offline (relative paths so the app
// also works when served from a subdirectory).
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './sw.js',
  './mySketch.js',
  './Lou24.png',
  './manifest.json',
  './apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/p5@1.11.3/lib/p5.js' // p5js lib (opaque)
];

// 1. Install Event: Cache all critical files.
// cache.addAll() rejects if ANY request fails (e.g. the cross-origin
// CDN response), which would break offline support entirely. Cache
// each asset individually and tolerate individual failures instead.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching app assets...');
      const requests = ASSETS_TO_CACHE.map((url) =>
        cache.add(new Request(url, { mode: 'no-cors' })).catch((err) => {
          console.warn('Failed to cache:', url, err);
        })
      );
      return Promise.all(requests);
    }).then(() => self.skipWaiting()) // Force the waiting SW active
  );
});

// 2. Activate Event: Clean up old caches if you update the version
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache...');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// 3. Fetch Event: network-first so updates show immediately; fall back
// to the cache only when offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Keep the cache fresh with successful basic/CORS responses
        if (response && (response.type === 'basic' ||
            response.type === 'cors')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) =>
          cachedResponse || console.log(
            'Network failed and asset not in cache:', event.request.url
          )
        )
      )
  );
});
