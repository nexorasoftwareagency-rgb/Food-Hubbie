/**
 * ============================================================
 * FOODHUBBIE SAAS — Firebase Configuration
 * ============================================================
 * PROJECT: food-hubbie
 * ============================================================
 */

// Browser-side Firebase config (for Admin, Rider, Marketplace)
export const FOODHUBBIE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: "food-hubbie.firebaseapp.com",
  databaseURL: "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: "food-hubbie",
  storageBucket: "food-hubbie.firebasestorage.app",
  messagingSenderId: "952017160550",
  appId: "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: "G-SQK852HT4W"
};

// Server-side Firebase URL (for Bot / Node.js)
export const FIREBASE_DATABASE_URL = "https://food-hubbie-default-rtdb.firebaseio.com";

// App Check (reCAPTCHA v3 for browser clients)
export const RECAPTCHA_SITE_KEY = "REPLACE_WITH_YOUR_RECAPTCHA_V3_SITE_KEY";

// Standard ESM Default Export
export default {
  FOODHUBBIE_FIREBASE_CONFIG,
  FIREBASE_DATABASE_URL,
  RECAPTCHA_SITE_KEY
};
