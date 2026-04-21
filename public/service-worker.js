const VERSION = 'mhg-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const IMAGE_CACHE = `${VERSION}-images`;

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/css/tailwind.css',
  '/js/script.js',
  '/images/logo.png',
  '/images/default.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => ![SHELL_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(key))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      staleWhileRevalidate(request, RUNTIME_CACHE).then((response) => response || caches.match('/offline.html'))
    );
    return;
  }

  const requestUrl = new URL(request.url);

  if (request.destination === 'image' || requestUrl.hostname.includes('cloudinary.com') || requestUrl.hostname.includes('cartocdn.com')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (['style', 'script', 'font'].includes(request.destination) || requestUrl.pathname.endsWith('.json')) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
