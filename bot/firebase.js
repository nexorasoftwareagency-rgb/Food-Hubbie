/**
 * ============================================================
 * FOODHUBBIE SAAS — Unified Bot Firebase Module (tenant-aware)
 * ============================================================
 * Replaces the legacy Pizza-bot/firebase.js and Cake-bot/firebase.js
 * with a single, multi-tenant Firebase connector.
 *
 * ARCHITECTURE (Phase 2 — PR 14):
 * - No module-level BUSINESS_ID/OUTLET_ID constants.
 * - Process-wide: `db`, `admin`, `getGlobalData` only.
 * - Per-tenant: `tenantContext({businessId, outletId, label})` returns
 *   a bound set of helpers.
 *
 * The env-var hard-exit from PR 5 is removed. The orchestrator
 * (bot/multi-tenant.js) is now the source of truth for which tenants
 * the bot serves, and it reads them from `system/bot_routing/`.
 * ============================================================
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const { createFirebaseOps, resolvePath } = require('../shared/firebase-helpers');
const { FIREBASE_DATABASE_URL: CONFIG_DB_URL } = require('../config/firebase-config');

const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL || CONFIG_DB_URL;

// ─── Firebase Initialization (process-wide) ─────────────────

try {
  const serviceAccountPath = path.join(__dirname, 'service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: FIREBASE_DATABASE_URL
      });
      console.log(`✅ [Firebase] Initialized with Service Account`);
    }
  } else {
    if (!admin.apps.length) {
      admin.initializeApp({ databaseURL: FIREBASE_DATABASE_URL });
      console.warn("⚠️ [Firebase] service-account.json not found. Bot may face permission issues on EC2.");
    }
  }
} catch (e) {
  console.error("❌ [Firebase] Initialization Error:", e.message);
  if (!admin.apps.length) {
    admin.initializeApp({ databaseURL: FIREBASE_DATABASE_URL });
  }
}

const db = admin.database();
const ops = createFirebaseOps(db);

// ─── Tenant Context Factory ────────────────────────────────

/**
 * Returns a tenant-scoped helper bundle bound to the given business/outlet.
 * Use one context per outlet. The `label` is used in log lines so
 * multi-tenant output is greppable.
 *
 * @param {{businessId: string, outletId: string, label?: string}} tenant
 * @returns {object} bound helpers + identity
 */
function tenantContext(tenant) {
  const businessId = tenant?.businessId;
  const outletId = tenant?.outletId;
  const label = tenant?.label || `${businessId}/${outletId}`;

  if (!businessId || !outletId) {
    throw new Error(
      `[Firebase] tenantContext requires {businessId, outletId} — got ` +
      `bid="${businessId}" oid="${outletId}" (label="${label}"). ` +
      `Refusing to create a context that would silently misroute writes.`
    );
  }

  return {
    businessId,
    outletId,
    label,
    resolvePath: (p) => resolvePath(p, businessId, outletId),
    getData: (path) => ops.getData(path, businessId, outletId),
    setData: (path, data) => ops.setData(path, data, businessId, outletId),
    updateData: (path, data) => ops.updateData(path, data, businessId, outletId),
    deleteData: (path) => ops.deleteData(path, businessId, outletId),
    pushData: (path, data) => ops.pushData(path, data, businessId, outletId),
    getUserProfile: (jid) => ops.getUserProfile(jid, businessId, outletId),
    saveUserProfile: (jid, data) => ops.saveUserProfile(jid, data, businessId, outletId)
  };
}

// ─── Global (non-tenant) reads ─────────────────────────────

async function getGlobalData(path) {
  const ref = db.ref(path);
  const snap = await ref.once('value');
  return snap.val();
}

// ─── Low-level helpers (unbound) ───────────────────────────
//
// Use these only when the caller knows the (businessId, outletId)
// at call time AND cannot use a `tenantContext`. The engine uses
// this to read the *user's* active outlet (which may differ from
// the bot's tenant in GLOBAL discovery mode). Prefer the bound
// `tenantContext` helpers everywhere else — they make the data
// path obvious at the call site.

async function getData(path, businessId, outletId) {
  return ops.getData(path, businessId, outletId);
}

async function setData(path, data, businessId, outletId) {
  return ops.setData(path, data, businessId, outletId);
}

async function updateData(path, data, businessId, outletId) {
  return ops.updateData(path, data, businessId, outletId);
}

async function pushData(path, data, businessId, outletId) {
  return ops.pushData(path, data, businessId, outletId);
}

async function deleteData(path, businessId, outletId) {
  return ops.deleteData(path, businessId, outletId);
}

// ─── Exports ───────────────────────────────────────────────

module.exports = {
  db,
  admin,
  tenantContext,
  getGlobalData,
  getData,
  setData,
  updateData,
  pushData,
  deleteData
};
