const V='2026-08-12-92c838d47a';
const ASSETS=["./", "index.html", "data/bundle.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* Pages and data go to the network first, so an online visitor always gets the current
   version instead of yesterday's cached copy; the cache is the fallback when offline.
   Images and icons stay cache-first because they are large and rarely change. */
const NET_FIRST = /(\/|\.html|bundle\.js)$/;
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const path = new URL(e.request.url).pathname;
  const fresh = e.request.mode === 'navigate' || NET_FIRST.test(path);
  if (fresh){
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200)
          caches.open(V).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request).then(hit => hit || caches.match('index.html')))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic')
          caches.open(V).then(c => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match('index.html')))
    );
  }
});
