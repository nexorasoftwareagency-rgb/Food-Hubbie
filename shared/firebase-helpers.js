/**
 * ============================================================
 * FOODHUBBIE SAAS — Multi-Tenant Firebase Helpers
 * ============================================================
 * Replaces legacy resolvePath(path, outlet='pizza') with
 * dynamic businessId/outletId resolution for true SaaS isolation.
 * 
 * PRESERVED SOUL:
 * - Cache layer with TTL (from Pizza-bot/firebase.js)
 * - Path resolution logic (genericized)
 * - getUserProfile / saveUserProfile patterns
 * ============================================================
 */

// ─── Path Resolution ───────────────────────────────────────

/**
 * Global/shared database nodes that live at the root level.
 * These are NOT scoped to any business or outlet.
 */
const GLOBAL_NODES = [
  'admins',
  'riders',
  'riderStats',
  'bot',
  'logs',
  'superAdmin',
  'businesses',
  'platformConfig'
];

/**
 * Resolves a database path for multi-tenant SaaS architecture.
 * 
 * @param {string} path - The relative path (e.g., 'orders/abc123')
 * @param {string} businessId - The business identifier
 * @param {string} outletId - The outlet identifier within the business
 * @returns {string} The fully-resolved Firebase path
 * 
 * @example
 * resolvePath('orders/abc123', 'biz_001', 'outlet_pizza')
 * // => 'businesses/biz_001/outlets/outlet_pizza/orders/abc123'
 * 
 * resolvePath('admins/uid123')
 * // => 'admins/uid123' (global node, not scoped)
 */
function resolvePath(path, businessId, outletId) {
  if (!path) return '';

  const rootNode = path.split('/')[0];

  // Global nodes stay at root level
  if (GLOBAL_NODES.includes(rootNode)) {
    return path;
  }

  // All other paths are scoped to business → outlet
  if (!businessId || !outletId) {
    console.warn(`⚠️ [resolvePath] Missing businessId or outletId for path: ${path}`);
    return path;
  }

  return `businesses/${businessId}/outlets/${outletId}/${path}`;
}


// ─── Cache Layer (preserved from legacy) ───────────────────

const _cache = new Map();
const DEFAULT_TTL = 30000;    // 30 seconds
const SETTINGS_TTL = 300000;  // 5 minutes for slow-changing data

/**
 * Determines cache TTL based on path type.
 * Settings, categories, and dishes change rarely → longer TTL.
 */
function getTTL(path) {
  if (path.includes('settings') || path.includes('categories') || path.includes('menu')) {
    return SETTINGS_TTL;
  }
  return DEFAULT_TTL;
}

/**
 * Invalidate all cache entries matching a prefix.
 * Useful when an outlet's data changes globally.
 */
function invalidateCache(prefix) {
  for (const key of _cache.keys()) {
    if (key.startsWith(prefix)) {
      _cache.delete(key);
    }
  }
}

/**
 * Clear entire cache. Use on logout or business switch.
 */
function clearCache() {
  _cache.clear();
}


// ─── CRUD Operations (multi-tenant aware) ──────────────────

/**
 * Factory: creates tenant-scoped CRUD helpers bound to a Firebase db instance.
 * 
 * @param {object} db - Firebase database instance (admin.database() or firebase.database())
 * @returns {object} CRUD methods scoped to the provided db
 */
function createFirebaseOps(db) {

  async function getData(path, businessId, outletId) {
    const resolved = resolvePath(path, businessId, outletId);
    const now = Date.now();

    if (_cache.has(resolved)) {
      const cached = _cache.get(resolved);
      if (now < cached.expiry) {
        return cached.data;
      }
    }

    try {
      const snap = await db.ref(resolved).once('value');
      const data = snap.val();
      _cache.set(resolved, { data, expiry: now + getTTL(resolved) });
      return data;
    } catch (err) {
      console.error("GET ERROR:", err.message, "Path:", resolved);
      return null;
    }
  }

  async function setData(path, data, businessId, outletId) {
    try {
      const resolved = resolvePath(path, businessId, outletId);
      _cache.delete(resolved);
      await db.ref(resolved).set(data);
      return true;
    } catch (err) {
      console.error("SET ERROR:", err.message, "Path:", path);
      return false;
    }
  }

  async function updateData(path, data, businessId, outletId) {
    try {
      const resolved = resolvePath(path, businessId, outletId);
      _cache.delete(resolved);
      await db.ref(resolved).update(data);
      return true;
    } catch (err) {
      console.error("UPDATE ERROR:", err.message, "Path:", path);
      return false;
    }
  }

  async function pushData(path, data, businessId, outletId) {
    try {
      const resolved = resolvePath(path, businessId, outletId);
      _cache.delete(resolved);
      const ref = await db.ref(resolved).push(data);
      return ref.key;
    } catch (err) {
      console.error("PUSH ERROR:", err.message, "Path:", path);
      return null;
    }
  }

  async function deleteData(path, businessId, outletId) {
    try {
      const resolved = resolvePath(path, businessId, outletId);
      _cache.delete(resolved);
      await db.ref(resolved).remove();
      return true;
    } catch (err) {
      console.error("DELETE ERROR:", err.message, "Path:", path);
      return false;
    }
  }

  /**
   * Get a WhatsApp user profile (preserved from legacy bot logic).
   * Phone-based lookup under the outlet's botUsers node.
   */
  async function getUserProfile(jid, businessId, outletId) {
    const cleanJid = jid.replace(/[^0-9]/g, '');
    return getData(`botUsers/${cleanJid}`, businessId, outletId);
  }

  /**
   * Save/update a WhatsApp user profile.
   */
  async function saveUserProfile(jid, data, businessId, outletId) {
    const cleanJid = jid.replace(/[^0-9]/g, '');
    return updateData(`botUsers/${cleanJid}`, data, businessId, outletId);
  }

  /**
   * Listen to a path in real-time (for Admin dashboard).
   * Returns the unsubscribe function.
   */
  function onValue(path, callback, businessId, outletId) {
    const resolved = resolvePath(path, businessId, outletId);
    const ref = db.ref(resolved);
    ref.on('value', (snap) => callback(snap.val(), snap));
    return () => ref.off('value');
  }

  return {
    getData,
    setData,
    updateData,
    pushData,
    deleteData,
    getUserProfile,
    saveUserProfile,
    onValue
  };
}


// ─── Exports ───────────────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    resolvePath,
    GLOBAL_NODES,
    createFirebaseOps,
    invalidateCache,
    clearCache
  };
}

if (typeof window !== 'undefined') {
  window.FirebaseHelpers = {
    resolvePath,
    GLOBAL_NODES,
    createFirebaseOps,
    invalidateCache,
    clearCache
  };
}
