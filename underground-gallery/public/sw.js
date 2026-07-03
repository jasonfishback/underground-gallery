// Underground Gallery service worker.
//
// Conservative by design: this is an authed app with private data, so we do NOT
// cache HTML pages or API responses (stale private content would be a bug).
// We only precache the app shell's static icons and serve an offline fallback
// for navigations when the network is down — enough to be installable + resilient.

const VERSION = 'ug-v1';
const STATIC_CACHE = `static-${VERSION}`;
const PRECACHE = [
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch R2/3rd-party
  if (url.pathname.startsWith('/api/')) return; // never cache API/auth

  // Cache-first for immutable static assets (icons, hashed _next/static).
  const isStatic =
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:png|svg|ico|webp|jpg|jpeg|woff2?)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          }),
      ),
    );
    return;
  }

  // Navigations: network-first, fall back to a cached shell only when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(
        () =>
          caches.match('/offline') ||
          new Response(
            '<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">' +
              '<body style="background:#05060a;color:#f5f6f7;font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0">' +
              '<div style="text-align:center"><div style="color:#ff2a2a;letter-spacing:.3em;font-size:12px">// OFFLINE</div>' +
              '<p style="opacity:.6">No connection. Reconnect to load Underground Gallery.</p></div>',
            { headers: { 'Content-Type': 'text/html' } },
          ),
      ),
    );
  }
});
