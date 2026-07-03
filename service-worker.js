const cacheName = 'mbn-artwork-v2'; // غيرنا الاسم لـ v2 عشان نلغي القديم البايظ
const staticAssets = [
  './',
  './index.html',
  './manifest.json',
  './style.css',
  './script.js'
];

self.addEventListener('install', async el => {
  const cache = await caches.open(cacheName);
  await cache.addAll(staticAssets);
  return self.skipWaiting();
});

self.addEventListener('activate', el => {
  self.clients.claim();
});

self.addEventListener('fetch', el => {
  const req = el.request;
  const url = new URL(req.url);

  // كاش فقط لملفات موقعك الداخلية
  if (url.origin === location.origin) {
    el.respondWith(cacheFirst(req));
  }
  // أي طلب خارجي (زي صور سوبابيز Supabase) سيبه يمر طبيعي من النت وميتدخلش فيه
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  return cached || fetch(req);
}