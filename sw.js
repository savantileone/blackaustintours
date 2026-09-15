// Caches just enough to let the lock screen and the (still-encrypted) app
// open without a network connection. Once unlocked, Google Sheets sync still
// needs real connectivity — this only covers getting the app itself open.
const CACHE = 'bat-shell-v1';
const SHELL = [
  './',
  './index.html',
  './app.encrypted',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;      // never intercept the Google Sheets calls
  if(!SHELL.some((p) => url.pathname.endsWith(p.replace('./', '')))) return;

  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
