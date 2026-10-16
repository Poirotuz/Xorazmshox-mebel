// Mebel Konstruktor — oflayn ishlash uchun service worker
const CACHE = 'konstruktor-4f7ba4e358';
const ASSETS = ["./","./index.html","./manifest.webmanifest","./favicon-32.png","./icon-180.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase so'rovlari keshlanmaydi
  if (req.mode === 'navigate') {
    // Avval tarmoq (yangilanish uchun), 3 soniyada javob bo'lmasa yoki internet yo'q bo'lsa — keshdan
    e.respondWith(new Promise((resolve) => {
      let done = false;
      const fromCache = () => caches.match('./index.html').then((r) => r || caches.match('./'));
      const t = setTimeout(() => { if (!done) { done = true; fromCache().then((r) => resolve(r || fetch(req))); } }, 3000);
      fetch(req).then((r) => {
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); }
        if (!done) { done = true; clearTimeout(t); resolve(r); }
      }).catch(() => { if (!done) { done = true; clearTimeout(t); fromCache().then((r) => resolve(r || Response.error())); } });
    }));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((resp) => {
    if (resp && resp.ok) { const copy = resp.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return resp;
  })));
});
