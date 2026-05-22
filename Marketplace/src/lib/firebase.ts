import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, get, child, query, orderByChild, equalTo, push, set, update } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
const FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
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
