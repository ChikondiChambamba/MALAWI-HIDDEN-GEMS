const VERSION = 'mhg-v7';
const SHELL_CACHE = `${VERSION}-shell`;
const PAGE_CACHE = `${VERSION}-pages`;
const ASSET_CACHE = `${VERSION}-assets`;
const IMAGE_CACHE = `${VERSION}-images`;
const ACTIVE_CACHES = [SHELL_CACHE, PAGE_CACHE, ASSET_CACHE, IMAGE_CACHE];

// Partials imported by /css/style.css. Keep in sync with its @import list.
const CSS_FILES = [
  '/css/base/tokens.css',
  '/css/base/base.css',
  '/css/base/typography.css',
  '/css/components/buttons.css',
  '/css/components/tags.css',
  '/css/components/surfaces.css',
  '/css/components/section-head.css',
  '/css/components/story-card.css',
  '/css/components/pagination.css',
  '/css/components/forms.css',
  '/css/components/map.css',
  '/css/layout/header.css',
  '/css/layout/footer.css',
  '/css/pages/home.css',
  '/css/pages/story.css',
  '/css/pages/about.css',
  '/css/pages/contact.css',
  '/css/pages/admin.css',
  '/css/pages/status.css',
];

const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/css/style.css',
  ...CSS_FILES,
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
