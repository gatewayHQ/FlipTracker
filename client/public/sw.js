const CACHE = 'flipfolio-v1';
const STATIC = ['/'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for API calls, cache-first for static assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never cache Supabase API calls
  if (url.hostname.includes('supabase.co')) return;

  // Cache-first for static assets
  if (e.request.destination === 'script' ||
      e.request.destination === 'style' ||
      e.request.destination === 'image' ||
      e.request.destination === 'font') {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // Network-first for navigation (HTML)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
  }
});
