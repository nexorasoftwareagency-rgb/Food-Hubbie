// FoodHubbie Admin — Firebase Messaging Service Worker
// Required by Firebase SDK for background push notifications.
// Uses CDN imports because service workers have no access to Vite's bundler.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
});

const fcmMessaging = firebase.messaging();

fcmMessaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'FoodHubbie Alert';
  const options = {
    body: payload.notification?.body || 'Open dashboard for details.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: '/', clickAction: payload.data?.clickAction || 'open' }
  };
  self.registration.showNotification(title, options);
});
