import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, get, child, query, orderByChild, equalTo, push, set, update } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
const FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "food-hubbie.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "food-hubbie",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "food-hubbie.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "952017160550",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SQK852HT4W"
};

// Initialize Firebase
const app = initializeApp(FOODHUBBIE_FIREBASE_CONFIG);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const db = getDatabase(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { 
  app, 
  analytics, 
  db, 
  auth, 
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  firebaseSignOut,
  ref, 
  get, 
  child, 
  query, 
  orderByChild, 
  equalTo,
  push,
  set,
  update
};
export default app;
