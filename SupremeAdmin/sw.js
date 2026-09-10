const CACHE = 'supreme-admin-v2';
const CDN_HOSTS = [
  'cdn.jsdelivr.net','cdnjs.cloudflare.com'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    '/','style.css','app.js','env-config.js','manifest.json',
    'firebase/firebase-app-compat.js','firebase/firebase-auth-compat.js',
    'firebase/firebase-database-compat.js','firebase/firebase-firestore-compat.js'
  ])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (CDN_HOSTS.some(d => url.hostname.includes(d))) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }).catch(() => new Response('',{status:503}))));
  }
});