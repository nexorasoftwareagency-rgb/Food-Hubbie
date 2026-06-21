// FoodHubbie Admin service worker.
// Strategy: network-first for navigations and the app shell (so updates roll
// out fast), cache-first for hashed Vite assets and the offline fallback.
// Never caches Firebase API calls — those are auth-gated and must always be live.
// Also handles push notifications and notification clicks for FCM.

const CACHE_VERSION = "fh-admin-v3";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const SHELL_URLS = ["/", "/index.html", "/manifest.webmanifest", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

function isFirebase(url) {
  const h = url.hostname;
  return (
    h.endsWith(".firebaseio.com") ||
    h.endsWith(".googleapis.com") ||
    h.endsWith(".firebaseapp.com") ||
    h.endsWith(".firebasestorage.app") ||
    h === "www.google.com" ||
    h === "www.gstatic.com"
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    // cross-origin — do not intercept (lets Firebase & reCAPTCHA work)
    return;
  }
  if (isFirebase(url)) return;

  // Network-first for navigations
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => null);
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/index.html")))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res.ok && (req.destination === "script" || req.destination === "style" || req.destination === "image" || req.destination === "font")) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => null);
          }
          return res;
        })
        .catch(() => cached || new Response("", { status: 504, statusText: "offline" }));
    })
  );
});

// Push event — displays notification from FCM or Web Push
self.addEventListener("push", (event) => {
  let payload;
  try { payload = event.data ? event.data.json() : {}; } catch (_) { payload = {}; }
  const title = payload.notification?.title || payload.title || "FoodHubbie";
  const options = {
    body: payload.notification?.body || payload.body || "",
    icon: payload.notification?.icon || "/favicon.svg",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: payload.data || { url: "/" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click — focuses existing tab or opens new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
