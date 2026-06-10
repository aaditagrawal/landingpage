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

	// Content-hashed build assets never change: cache-first.
	if (url.pathname.startsWith("/assets/")) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE);
				const hit = await cache.match(request);
				if (hit) return hit;
				const response = await fetch(request);
				if (response.ok) cache.put(request, response.clone());
				return response;
			})(),
		);
		return;
	}

	// Pages, icons, PDFs: stale-while-revalidate.
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			const hit = await cache.match(request);
			const refresh = fetch(request)
				.then((response) => {
					if (response.ok) cache.put(request, response.clone());
					return response;
				})
				.catch(() => hit);
			return hit || refresh;
		})(),
	);
});
