const cacheName = 'mbn-artwork-v1';
const staticAssets = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', async el => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});

self.addEventListener('activate', el => {
  self.clients.claim();
});

self.addEventListener('fetch', async el => {
  const req = el.request;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    el.respondWith(cacheFirst(req));
  } else {
    el.respondWith(networkAndCache(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}

async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const refresh = await fetch(req);
    await cache.put(req, refresh.clone());
    return refresh;
  } catch (hi) {
    const cached = await cache.match(req);
    return cached;
  }
}