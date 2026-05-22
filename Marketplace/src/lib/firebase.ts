import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, get, child, query, orderByChild, equalTo, push, set, update } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import * as FirebaseConfig from "@config/firebase-config";

// Initialize Firebase
const app = initializeApp(FirebaseConfig.FOODHUBBIE_FIREBASE_CONFIG);
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
