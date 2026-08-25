// Minimal service worker for offline caching and background sync fallback
// Uses Cache API for static assets and a simple fetch handler.
const CACHE_NAME = 'mkulimacollect-v1';
const ASSETS_TO_CACHE = ['/index.html', '/src/main.tsx', '/src/index.css'];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {}),
  );
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event: any) => {
  const req = event.request;
  // Prefer network, fallback to cache for GET
  if (req.method !== 'GET') return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Update cache in background
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match('/index.html'))),
  );
});

// Background sync registration is done in the app when online state is regained.
self.addEventListener('sync', (event: any) => {
  // Placeholder: the app should implement a named tag and the service worker should postMessage to clients
  if (event.tag === 'sync-outbox') {
    event.waitUntil(self.clients.matchAll().then((clients) => clients.forEach((c) => c.postMessage({ type: 'SYNC_NOW' }))));
  }
});
