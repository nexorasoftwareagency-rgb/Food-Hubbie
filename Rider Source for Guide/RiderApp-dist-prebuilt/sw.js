// === public/sw.js ===
// PWA service worker for FoodHubbie Rider (React build). Network-first for the
// app shell (so riders always get the latest code the moment they reopen the
// app), cache-first-with-network-fallback for static assets, so the app still
// opens instantly with stale-but-usable UI during real dead zones.

const CACHE_NAME = "foodhubbie-rider-v5.0.0";
const PRECACHE_ASSETS = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png", "/favicon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let Firebase/CDN requests pass through untouched

  const isNavigation = request.mode === "navigate";
  const isAppShellAsset = /\.(js|css|html)$/.test(url.pathname) || url.pathname === "/";

  if (isNavigation || isAppShellAsset) {
    // Network-first: riders always get the newest build when online.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/");
        })
    );
    return;
  }

  // Cache-first for hashed static assets (images, fonts, etc.) — safe since Vite
  // fingerprints filenames, so a cached copy is never stale for a given URL.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
