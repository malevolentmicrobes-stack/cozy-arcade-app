/* Cozy Arcade Service Worker — offline-first for ABIM study anywhere */
const CACHE = 'cozy-arcade-v9';

/* On install: cache the app shell */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(['./', './index.html']))
      .then(() => self.skipWaiting())
  );
});

/* On activate: delete old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Fetch strategy:
   - index.html / app root → stale-while-revalidate (instant load, refresh in background)
   - CDN (fonts, three.js) → cache-first with network fallback
   - Everything else → network-first, cache fallback */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Only handle GET */
  if (event.request.method !== 'GET') return;

  /* App shell: stale-while-revalidate */
  if (url.pathname.endsWith('/') || url.pathname.endsWith('index.html') || url.pathname.endsWith('sw.js')) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const fresh = fetch(event.request).then(res => {
            if (res && res.status === 200) cache.put(event.request, res.clone());
            return res;
          }).catch(() => cached);
          return cached || fresh;
        })
      )
    );
    return;
  }

  /* CDN resources (Google Fonts, three.js): cache-first */
  if (url.hostname !== self.location.hostname) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 503, statusText: 'Offline' }));
      })
    );
  }
});
