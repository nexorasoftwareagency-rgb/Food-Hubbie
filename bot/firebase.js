/**
 * ============================================================
 * FOODHUBBIE SAAS — Unified Bot Firebase Module
 * ============================================================
 * Replaces the legacy Pizza-bot/firebase.js and Cake-bot/firebase.js
 * with a single, multi-tenant Firebase connector.
 * 
 * PRESERVED SOUL:
 * - Service account loading with graceful fallback
 * - Cache layer with TTL-based invalidation
 * - Path resolution via shared/firebase-helpers.js
 * - getUserProfile / saveUserProfile (phone-based lookup)
 * 
 * CLEANED:
 * - Removed hardcoded 'pizza'/'cake' outlet defaults
 * - Removed legacy Firebase URL
 * - Uses FIREBASE_DATABASE_URL from config
 * ============================================================
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Import shared helpers
const { createFirebaseOps, resolvePath } = require('../shared/firebase-helpers');

// ─── Configuration ─────────────────────────────────────────

// Import global config
const { FIREBASE_DATABASE_URL: CONFIG_DB_URL } = require('../config/firebase-config');

// Database URL from config
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || CONFIG_DB_URL;

// Bot Identity: which business/outlet is this instance serving
const BUSINESS_ID = process.env.BUSINESS_ID || "business_roshani";
const OUTLET_ID = process.env.OUTLET_ID || "outlet_default";

// ─── Firebase Initialization (preserved pattern) ──────────

try {
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: FIREBASE_DATABASE_URL
      });
      console.log(`✅ [Firebase] Initialized with Service Account for ${BUSINESS_ID}/${OUTLET_ID}`);
    }
  } else {
    if (!admin.apps.length) {
      admin.initializeApp({
        databaseURL: FIREBASE_DATABASE_URL
      });
      console.warn("⚠️ [Firebase] WARNING: service-account.json not found. Bot may face permission issues on EC2.");
    }
  }
} catch (e) {
  console.error("❌ [Firebase] Initialization Error:", e.message);
  if (!admin.apps.length) {
    admin.initializeApp({
      databaseURL: FIREBASE_DATABASE_URL
    });
  }
}

const db = admin.database();

// Create tenant-scoped operations using shared helper factory
const ops = createFirebaseOps(db);

// ─── Convenience Wrappers (bound to this bot's outlet OR dynamic outlet) ─────

/**
 * All data operations are pre-scoped. 
 * Supports session-based outlet dynamic switching if outletOverride is provided.
 */
async function getData(path, outletOverride = null) {
  return ops.getData(path, BUSINESS_ID, outletOverride || OUTLET_ID);
}

async function setData(path, data, outletOverride = null) {
  return ops.setData(path, data, BUSINESS_ID, outletOverride || OUTLET_ID);
}

async function updateData(path, data, outletOverride = null) {
  return ops.updateData(path, data, BUSINESS_ID, outletOverride || OUTLET_ID);
}

async function pushData(path, data, outletOverride = null) {
  return ops.pushData(path, data, BUSINESS_ID, outletOverride || OUTLET_ID);
}

async function deleteData(path, outletOverride = null) {
  return ops.deleteData(path, BUSINESS_ID, outletOverride || OUTLET_ID);
}

async function getUserProfile(jid, outletOverride = null) {
  return ops.getUserProfile(jid, BUSINESS_ID, outletOverride || OUTLET_ID);
}

async function saveUserProfile(jid, data, outletOverride = null) {
  return ops.saveUserProfile(jid, data, BUSINESS_ID, outletOverride || OUTLET_ID);
}

/**
 * Access global/system nodes outside the business/outlet scope
 */
async function getGlobalData(path) {
  const ref = db.ref(path);
  const snap = await ref.once('value');
  return snap.val();
}

// ─── Exports ───────────────────────────────────────────────

module.exports = {
  db,
  admin,
  resolvePath: (p) => resolvePath(p, BUSINESS_ID, OUTLET_ID),
  getData,
  setData,
  updateData,
  deleteData,
  pushData,
  getUserProfile,
  saveUserProfile,
  getGlobalData,
  BUSINESS_ID,
  OUTLET_ID
};
