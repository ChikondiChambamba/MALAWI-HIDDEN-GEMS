const VERSION = 'mhg-v6';
const SHELL_CACHE = `${VERSION}-shell`;
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
const IMAGE_CACHE = `${VERSION}-images`;
const ACTIVE_CACHES = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE, IMAGE_CACHE];

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/js/script.js',
  '/images/logo.png',
  '/images/default.jpg',
  '/images/hero-bg.jpg',
];

// Pages that depend on a session or editor cookie must never be served from cache.
const UNCACHEABLE_PAGE = /^\/(admin|posts\/new|create)(\/|$)|^\/posts\/\d+\/edit/;

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
        .filter((key) => !ACTIVE_CACHES.includes(key))
        .map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

async function networkFirst(request, cacheName, { offlineFallback = false } = {}) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return offlineFallback ? caches.match('/offline.html') : Response.error();
  }
}

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
    .catch(() => cachedResponse || Response.error());

  return cachedResponse || networkPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (request.mode === 'navigate') {
    if (requestUrl.origin === self.location.origin && UNCACHEABLE_PAGE.test(requestUrl.pathname)) {
      return;
    }

    // Fresh content when online (new stories show up immediately), cached copy offline.
    event.respondWith(networkFirst(request, PAGE_CACHE, { offlineFallback: true }));
    return;
  }

  if (request.destination === 'image' || requestUrl.hostname.endsWith('cloudinary.com') || requestUrl.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE));
    return;
  }

  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (['style', 'script', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});
