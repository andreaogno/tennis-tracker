/* Tennis Tracker: funzionamento offline.
   Con rete scarica sempre pagina e manifest aggiornati; senza rete usa la copia salvata.
   Quando pubblichi una nuova versione cambia il numero qui sotto (tt-v3 -> tt-v4). */
const VERSION = 'tt-v3';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'xlsx.full.min.js',
  'barlow-condensed-latin-500-normal.woff2', 'barlow-condensed-latin-600-normal.woff2',
  'barlow-condensed-latin-700-normal.woff2', 'dm-sans-latin-wght-normal.woff2',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html') || url.pathname.endsWith('.webmanifest');
  e.respondWith(caches.open(VERSION).then(async cache => {
    if (isPage) {
      try {
        const res = await fetch(url.href, { cache: 'no-cache' });
        if (res && res.ok) { cache.put(req.mode === 'navigate' ? 'index.html' : req, res.clone()); return res; }
      } catch (err) {}
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('index.html')) || Response.error();
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try { const res = await fetch(req); if (res && res.ok) cache.put(req, res.clone()); return res; } catch (err) { return Response.error(); }
  }));
});
