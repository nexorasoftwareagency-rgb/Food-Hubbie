// === src/lib/firebase.ts ===
// Firebase init — same project & pattern used by Marketplace / SupremeAdmin.
// Realtime Database (NOT Firestore). Modular SDK only.

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  push,
  runTransaction,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  off,
  serverTimestamp,
  onDisconnect,
  type Database,
} from "firebase/database";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
} from "firebase/auth";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported, type Messaging } from "firebase/messaging";
import { getAnalytics, type Analytics } from "firebase/analytics";

const FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W",
};

const app: FirebaseApp = initializeApp(FOODHUBBIE_FIREBASE_CONFIG);

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch {
    analytics = null;
  }
}

const db: Database = getDatabase(app);
const auth: Auth = getAuth(app);
const storage: FirebaseStorage = getStorage(app);

let messaging: Messaging | null = null;
if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) messaging = getMessaging(app);
    })
    .catch(() => {
      messaging = null;
    });
}

export function getMessagingInstance(): Messaging | null {
  return messaging;
}

export {
  app,
  analytics,
  db,
  auth,
  storage,
  FOODHUBBIE_FIREBASE_CONFIG,
  // database
  ref,
  get,
  set,
  update,
  remove,
  push,
  runTransaction,
  query,
  orderByChild,
  equalTo,
  limitToLast,
  onValue,
  off,
  serverTimestamp,
  onDisconnect,
  // auth
  signInWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  // storage
  storageRef,
  uploadBytes,
  getDownloadURL,
  // messaging
  getToken,
  onMessage,
};

export default app;
