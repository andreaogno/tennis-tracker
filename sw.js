/* Tennis Tracker: funzionamento offline.
   Quando pubblichi una nuova versione dell'app, cambia il numero qui sotto (tt-v1 -> tt-v2). */
const VERSION = 'tt-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'xlsx.full.min.js',
  'barlow-condensed-latin-500-normal.woff2', 'barlow-condensed-latin-600-normal.woff2',
  'barlow-condensed-latin-700-normal.woff2', 'dm-sans-latin-wght-normal.woff2',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      if (hit) { e.waitUntil(net); return hit; }
      const res = await net;
      return res || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    })
  );
});
