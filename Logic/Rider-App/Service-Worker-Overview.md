# Rider App — Service Worker & PWA Overview

## Files
- **sw.js** (124 lines) — Service Worker for offline support + push notifications
- **firebase-messaging-sw.js** (26 lines) — FCM background message handler (imports Firebase SDK)
- **manifest.json** (17 lines) — PWA manifest with app name, icon, theme color

## sw.js Architecture
```javascript
// Cache name for versioning
const CACHE_NAME = "foodhubbie-rider-v1";

// Install: pre-cache critical assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",
        "/index.html",
        "/app.js",
        "/style.css",
        "/assets/alert.mp3",
        // Firebase SDKs loaded from CDN
      ])
    )
  );
});

// Activate: clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
});

// Fetch: network-first, cache fallback
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
```

## Firebase Messaging SW (firebase-messaging-sw.js)
```javascript
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, clickAction } = payload.data;
  self.registration.showNotification(title, {
    body,
    icon,
    data: { url: clickAction || "/" },
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});
```

## PWA Manifest (manifest.json)
```json
{
  "name": "Foodhubbie Rider",
  "short_name": "Rider App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#FF5200",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## Key Behaviors
| Feature | Implementation |
|---|---|
| **Offline page** | Pre-cached index.html, app.js, style.css |
| **Push notifications** | FCM via Firebase Messaging SW |
| **Notification click** | Opens app (or navigates to order if data included) |
| **Cache strategy** | Network-first, cache fallback for all requests |
| **Versioning** | `?v=4.7.1` cache-busting on HTML/CSS/JS references |
| **Install prompt** | `beforeinstallprompt` event captured in app.js, shown via "Install App" in sidebar |
