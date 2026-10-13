/* SMILE service worker – offline app shell.
   Bump VERSION whenever you change files so users get the update. */
const VERSION = 'smile-v2.0.0';
const SHELL = [
  './', './index.html', './styles.css', './app.js', './data.js', './config.js', './manifest.webmanifest',
  './assets/hero.jpg', './assets/hero-sm.jpg', './assets/logo-circle.png',
  './assets/cat-landmarks.jpg', './assets/cat-restaurants.jpg', './assets/cat-shops.jpg', './assets/cat-events.jpg',
  './icons/icon-32.png', './icons/icon-96.png', './icons/icon-192.png', './icons/icon-512.png',
  './icons/maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache the Apps Script API; the app caches data itself.
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  // Page navigations: network first, fall back to cached shell
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(VERSION).then(c => c.put('./index.html', r.clone())); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }

  // Everything else (same-origin + Google Fonts): stale-while-revalidate
  e.respondWith(caches.match(req).then(cached => {
    const net = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => cached);
    return cached || net;
  }));
});
