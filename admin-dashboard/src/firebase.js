import { initializeApp, deleteApp } from "firebase/app";
import {
  getDatabase, ref, get, child, onValue, off, update, push, set, remove, serverTimestamp, query, orderByChild, equalTo, runTransaction
} from "firebase/database";
import {
  getAuth, setPersistence, browserLocalPersistence,
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  EmailAuthProvider, reauthenticateWithCredential,
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject
} from "firebase/storage";
import {
  initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider
} from "firebase/app-check";
import {
  getMessaging, getToken, onMessage, isSupported as isMessagingSupported
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD60fL5Q-St64KyMavdfA9to4ZyCdR-qG8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "food-hubbie.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://food-hubbie-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "food-hubbie",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "food-hubbie.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "952017160550",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:952017160550:web:80bbb75933f431ab54e0a7",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-SQK852HT4W"
};

// reCAPTCHA v3 site key (paired with food-hubbie Firebase project in console).
// Override at runtime by setting `window.__FOODHUBBIE_RECAPTCHA_SITE_KEY__` before
// this module loads.
const RECAPTCHA_SITE_KEY =
  (typeof window !== "undefined" && window.__FOODHUBBIE_RECAPTCHA_SITE_KEY__) ||
  import.meta.env.VITE_RECAPTCHA_SITE_KEY ||
  "6LeblvYsAAAAAPhR4Uw4kHZLsW50dxE8o2D2XIo3";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);

// ── Connection watcher ──────────────────────────────────────────────
let _fbConnected = false;
const _connWatchers = [];
onValue(ref(db, ".info/connected"), (snap) => {
  const c = snap.val() === true;
  if (c === _fbConnected) return;
  _fbConnected = c;
  if (c) console.log("[firebase] Connection restored.");
  else console.warn("[firebase] Lost connection.");
  _connWatchers.slice().forEach(fn => { try { fn(c); } catch (_) {} });
});
function isConnected() { return _fbConnected; }
function onConnectionChange(fn) {
  _connWatchers.push(fn);
  return () => { const i = _connWatchers.indexOf(fn); if (i >= 0) _connWatchers.splice(i, 1); };
}

// App Check (reCAPTCHA v3). On localhost we install a debug token so the
// reCAPTCHA iframe doesn't try to render in dev. Override via
// `window.__FOODHUBBIE_APP_CHECK_DEBUG_TOKEN__` for any other dev host.
try {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "";
    if (isLocalhost) {
      self.FIREBASE_APPCHECK_DEBUG_TOKEN =
        window.__FOODHUBBIE_APP_CHECK_DEBUG_TOKEN__ || true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
  }
} catch (err) {
  // App Check init failure is non-fatal — RTDB calls still work, they just
  // won't carry an attestation. Log and continue.
  console.warn("[firebase] App Check init failed:", err?.message || err);
}

let _auth = null;
let _authInitPromise = null;

export function getAuthInstance() {
  if (_auth) return Promise.resolve(_auth);
  if (_authInitPromise) return _authInitPromise;
  _authInitPromise = (async () => {
    _auth = getAuth(app);
    await setPersistence(_auth, browserLocalPersistence);
    return _auth;
  })();
  return _authInitPromise;
}

let _currentBusinessId = null;
let _currentOutletId = null;

export function setOutletContext(businessId, outletId) {
  _currentBusinessId = businessId;
  _currentOutletId = outletId;
}

export function Outlet(path) {
  if (!_currentBusinessId || !_currentOutletId) return null;
  return ref(db, `businesses/${_currentBusinessId}/outlets/${_currentOutletId}/${path}`);
}

export function getOutletRef(path) {
  return Outlet(path);
}

export function getCurrentOutletContext() {
  return { businessId: _currentBusinessId, outletId: _currentOutletId };
}

export function getBizId() { return _currentBusinessId; }
export function getOutletId() { return _currentOutletId; }

export async function uploadImage(file, storagePath) {
  const ref_ = storageRef(storage, storagePath);
  const snap = await uploadBytesResumable(ref_, file);
  return getDownloadURL(snap.ref);
}

export async function deleteImage(url) {
  try {
    const ref_ = storageRef(storage, url);
    await deleteObject(ref_);
  } catch (e) {
    console.warn("Image delete skipped:", e.message);
  }
}

// ── Bot status watcher ───────────────────────────────────────────────
let _botStatusUnsub = null;
export function startBotStatusWatcher() {
  if (_botStatusUnsub) { try { _botStatusUnsub(); } catch (_) {} _botStatusUnsub = null; }
  const outletId = _currentOutletId;
  if (!outletId) return;
  const statusRef = ref(db, `bot/${outletId}/status`);
  try {
    _botStatusUnsub = onValue(statusRef, (snap) => {
      const val = snap.val() || {};
      const seen = val.lastSeen || 0;
      const fresh = (Date.now() - seen) < 90 * 1000;
      const online = val.status === "Online" && fresh;
      window._botOnline = online;
      window._botLastSeen = seen;
      window.dispatchEvent(new CustomEvent("botStatusChange", { detail: { online, lastSeen: seen } }));
    }, (err) => {
      window._botOnline = false;
      window._botLastSeen = 0;
      window.dispatchEvent(new CustomEvent("botStatusChange", { detail: { online: false, lastSeen: 0 } }));
    });
  } catch (err) {
    window._botOnline = false;
    window._botLastSeen = 0;
    window.dispatchEvent(new CustomEvent("botStatusChange", { detail: { online: false, lastSeen: 0 } }));
  }
}

export {
  db, storage,
  ref, get, child, onValue, off, update, push, set, remove, serverTimestamp,
  query, orderByChild, equalTo, runTransaction,
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  EmailAuthProvider, reauthenticateWithCredential,
  storageRef, getDownloadURL,
  getMessaging, getToken, onMessage, isMessagingSupported,
  isConnected, onConnectionChange
};

// Audit log helper. Writes to `businesses/{bid}/outlets/{oid}/logs/audit/{pushId}`.
// Safe to call fire-and-forget; never throws back to the caller (audit failure
// should not block the originating op). Pass `actor` from the auth state.
export function logAudit(businessId, outletId, action, details, actor) {
  try {
    if (!businessId || !outletId) return Promise.resolve(null);
    const path = `businesses/${businessId}/outlets/${outletId}/logs/audit`;
    const entry = {
      action: String(action || "unknown").slice(0, 80),
      details: details || null,
      actor: actor
        ? { uid: actor.uid || null, email: actor.email || null, name: actor.displayName || null }
        : null,
      ts: serverTimestamp(),
      clientTs: Date.now()
    };
    return push(ref(db, path), entry).catch((e) => {
      console.warn("[audit] write failed:", e?.message || e);
      return null;
    });
  } catch (e) {
    console.warn("[audit] unexpected error:", e?.message || e);
    return Promise.resolve(null);
  }
}

// Resolve the current Firebase Auth user (may be null if signed out).
// Returns a plain { uid, email, displayName } object or null.
export function getCurrentAdminActor() {
  try {
    const auth = getAuth(app);
    const u = auth.currentUser;
    if (!u) return null;
    return { uid: u.uid || null, email: u.email || null, displayName: u.displayName || null };
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECONDARY AUTH — for rider / staff account management
// ═══════════════════════════════════════════════════════════════════════════
// We must NOT use the primary `app` to create new accounts, because
// `createUserWithEmailAndPassword` would log us in as the new user and
// displace the admin session. Instead we spin up a one-shot secondary app,
// perform the auth op, and immediately delete the secondary app.
//
// The secondary app's auth has no persistence, so the new user's session
// is ephemeral and never leaks into the admin's browser storage.

let _secondaryAppCounter = 0;

function makeSecondaryApp() {
  const name = `secondary-${Date.now()}-${++_secondaryAppCounter}`;
  return initializeApp(firebaseConfig, name);
}

function withSecondaryAuth(fn) {
  return (async () => {
    const sec = makeSecondaryApp();
    try {
      const secAuth = getAuth(sec);
      return await fn(secAuth);
    } finally {
      try { await deleteApp(sec); } catch (_) { /* noop */ }
    }
  })();
}

// Create a Firebase Auth account for a rider. Does NOT displace the admin
// session. The caller is responsible for writing the rider profile to
// `riders/{uid}` afterwards.
export async function createRiderAuthAccount(email, password) {
  if (!email || !password) throw new Error("Email and password are required");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  return withSecondaryAuth((secAuth) => createUserWithEmailAndPassword(secAuth, email, password)
    .then((cred) => ({ uid: cred.user.uid, email: cred.user.email })));
}

// Delete a Firebase Auth account by uid. Uses the secondary app so the
// admin's session is not affected. The user must be currently signed in
// on that secondary app — Firebase requires a recent login. To work around
// this, we sign the user in fresh first, then delete.
export async function deleteRiderAuthAccount(email, password) {
  if (!email || !password) throw new Error("Email and password are required");
  return withSecondaryAuth(async (secAuth) => {
    const cred = await signInWithEmailAndPassword(secAuth, email, password);
    const uid = cred.user.uid;
    await cred.user.delete();
    return { uid, email };
  });
}

// Reset a rider's password by signing them in on a secondary app and
// calling updatePassword. The admin supplies the new password; the rider's
// old password is not required (we re-authenticate via reauthenticateWithCredential
// after the user signs in with the new password themselves on next login).
// Note: Firebase does not allow password reset without the current password,
// so this implementation requires the admin to know the current password OR
// we can use a one-time sign-in flow. For now we expose a sign-in flow:
// admin enters the rider's current password, then sets a new one.
export async function resetRiderPassword(currentPassword, newPassword, email) {
  if (!email || !currentPassword || !newPassword) throw new Error("Email, current password, and new password are required");
  if (newPassword.length < 6) throw new Error("New password must be at least 6 characters");
  return withSecondaryAuth(async (secAuth) => {
    const cred = await signInWithEmailAndPassword(secAuth, email, currentPassword);
    await cred.user.updatePassword(newPassword);
    return { uid: cred.user.uid, email: cred.user.email };
  });
}
