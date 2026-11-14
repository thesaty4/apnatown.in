/* ApnaTown.in static-shell service worker (F-X-005/F-X-015).
 *
 * Only the offline screen and public static assets are cached. API responses,
 * private pages, media and OSM tiles are never cached, so cached state can
 * never grant access or survive an account/role change.
 */
const CACHE = 'apnatown-shell-v1';
const SHELL = [
  '/offline',
  '/hi/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

/** Cache an offline page plus the build assets its HTML references. */
async function precachePage(cache, page) {
  const response = await fetch(page, { cache: 'reload' });
  if (!response.ok) return;
  const html = await response.clone().text();
  await cache.put(page, response);
  const assets = new Set(
    [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)].map(
      (match) => match[1],
    ),
  );
  await Promise.allSettled([...assets].map((asset) => cache.add(asset)));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(async (cache) => {
        await Promise.allSettled(
          SHELL.map((entry) =>
            entry.startsWith('/_next/') || entry.startsWith('/icons/')
              ? cache.add(entry)
              : precachePage(cache, entry),
          ),
        );
        await self.skipWaiting();
      })
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') || pathname.startsWith('/icons/')
  );
}

/** Network-first navigations; the locale's offline screen when the network fails. */
function navigation(event, pathname) {
  event.respondWith(
    fetch(event.request).catch(() =>
      caches
        .match(pathname.startsWith('/hi/') ? '/hi/offline' : '/offline')
        .then((cached) => cached || Response.error()),
    ),
  );
}

/** Cache-first for fingerprint build assets and public icons. */
function staticAsset(event) {
  event.respondWith(
    caches.match(event.request).then(
      (cached) =>
        cached ||
        fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches
              .open(CACHE)
              .then((cache) => cache.put(event.request, copy));
          }
          return response;
        }),
    ),
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    navigation(event, url.pathname);
    return;
  }
  if (isStaticAsset(url.pathname)) staticAsset(event);
});
