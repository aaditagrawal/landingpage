// Repeat visits and slow networks: hashed assets are served cache-first
// (immutable by construction), everything else same-origin is served
// stale-while-revalidate, so return visits render instantly from cache while
// fresh copies download in the background. Pages degrade gracefully if a
// stale page references a purged script: CSS is inlined and links work
// without JS, so nothing user-facing breaks.
const CACHE = "site-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const response = (async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request);
    // Immutable assets need no refresh once cached.
    if (hit && url.pathname.startsWith("/assets/")) return hit;
    const refresh = fetch(request).then(async (fresh) => {
      if (fresh.ok) await cache.put(request, fresh.clone());
      return fresh;
    });
    // Return stale data immediately while protecting the refresh lifetime.
    refresh.catch(() => {});
    if (hit) {
      awaitRefresh = refresh.catch(() => {});
      return hit;
    }
    return refresh;
  })();
  let awaitRefresh;
  event.respondWith(response);
  event.waitUntil(response.then(() => awaitRefresh).catch(() => {}));
});
