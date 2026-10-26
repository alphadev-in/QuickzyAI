// Quickzy service worker. Caches the app shell and static assets only.
// Firebase, Stripe, map tiles and /api calls always go to the network, so live data is never stale.
const CACHE = 'quickzy-v1';
const SHELL = ['/', '/logo.png', '/favicon.png', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Versioned build assets and images: cache first
  if (url.pathname.startsWith('/_next/static/') || /\.(png|jpe?g|svg|ico|webp|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((cache) => cache.put(req, res.clone()));
            return res;
          })
      )
    );
    return;
  }

  // Pages: network first so updates and auth state are fresh; fall back to the cached shell offline
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((hit) => hit || caches.match('/'))));
  }
});
