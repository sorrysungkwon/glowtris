const CACHE      = 'glowtris-bff4c6';
const FONT_CACHE = 'glowtris-fonts-v1';
const APP_SHELL  = ['/index.html', '/manifest.json', '/favicon.svg', '/icon-192.svg', '/icon-512.svg', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
const FONT_URLS  = [
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap',
  'https://fonts.googleapis.com/icon?family=Material+Icons+Round&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE).then(c => c.addAll(APP_SHELL)),
      caches.open(FONT_CACHE).then(c =>
        Promise.all(FONT_URLS.map(url =>
          fetch(url).then(res => { if (res.ok) c.put(url, res); }).catch(() => {})
        ))
      ),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  const keep = [CACHE, FONT_CACHE];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // API calls always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Google Fonts CSS + font files: cache-first, long-lived
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok || res.type === 'opaque') {
            const clone = res.clone();
            caches.open(FONT_CACHE).then(c => c.put(request, clone));
          }
          return res;
        }).catch(() => new Response('', { status: 408, statusText: 'Offline' }));
      })
    );
    return;
  }

  // index.html: network-first so updates are picked up, cache as fallback
  if (url.pathname === '/' || url.pathname === '/index.html') {
    e.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put('/index.html', clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return res;
      });
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Glowtris', {
      body: data.body || "Today's daily challenge is live!",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(clients.openWindow(url));
});
