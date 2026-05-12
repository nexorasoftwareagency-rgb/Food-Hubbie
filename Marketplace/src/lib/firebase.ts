import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, get, child, query, orderByChild, equalTo, push, set } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { FOODHUBBIE_FIREBASE_CONFIG } from "@config/firebase-config";

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
  onAuthStateChanged,
  firebaseSignOut,
  ref, 
  get, 
  child, 
  query, 
  orderByChild, 
  equalTo,
  push,
  set
};
export default app;
