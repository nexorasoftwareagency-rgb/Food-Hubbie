import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, get, child, query, orderByChild, equalTo } from "firebase/database";
import { getAuth } from "firebase/auth";
import config from "@config/firebase-config";
const { FOODHUBBIE_FIREBASE_CONFIG } = config;

// Initialize Firebase
const app = initializeApp(FOODHUBBIE_FIREBASE_CONFIG);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const db = getDatabase(app);
const auth = getAuth(app);

export { app, analytics, db, auth, ref, get, child, query, orderByChild, equalTo };
export default app;
