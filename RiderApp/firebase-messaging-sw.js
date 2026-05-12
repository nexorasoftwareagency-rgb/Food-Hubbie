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

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  if (payload?.notification?.title && payload?.notification?.body) {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
      icon: '/icon-512.png'
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});