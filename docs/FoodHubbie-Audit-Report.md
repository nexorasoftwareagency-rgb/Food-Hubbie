# Food-Hubbie Codebase Audit Report
**Date:** May 20, 2026  
**Scope:** Full repository — Firebase security rules, Marketplace (React/TS), ShopAdmin (Vanilla JS), RiderApp, SuperAdmin, Bot (Node.js), shared config, and deployment config.  
**Severity Levels:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Executive Summary

The codebase is a multi-tenant food delivery SaaS built on Firebase Realtime Database. The architecture is ambitious and largely well-structured, but contains **5 critical security vulnerabilities**, **8 logic bugs**, **4 data-flow issues**, and **several dead code / structural problems** that must be addressed before production scale.

---

## 🔴 CRITICAL — Security Vulnerabilities

---

### CRIT-1: Plaintext Production Credentials in Version Control

**File:** `Credential.md`

**Problem:** The SuperAdmin password (`NexoraNs@9724649971`) for `Nexorasoftwareagency@gmail.com` is committed to the repository in plaintext. Anyone with repository access — past or present — has full SuperAdmin access to the live Firebase project.

**Impact:** Complete takeover of the Firebase project, all customer data, all order history, all wallet balances.

**Fix:**
1. **Immediately** rotate the SuperAdmin password in Firebase Authentication.
2. Delete `Credential.md` from the repository.
3. Purge it from Git history: `git filter-repo --path Credential.md --invert-paths`
4. Use environment variables or a secrets manager (e.g., GitHub Secrets, HashiCorp Vault) for any credentials that must be stored.
5. Never commit credentials, even "legacy" ones — they grant access to the live database.

---

### CRIT-2: Storage Rules — `isOutletRestricted` Logic Is Inverted

**File:** `storage.rules`, lines 39, 47, 54–58

**Problem:** The function `isOutletRestricted` is used as `allow read: if !isOutletRestricted(...)`. The function is supposed to *restrict* access, but its implementation actually *grants* access:

```javascript
// BUGGY — operator precedence makes this always grant access
function isOutletRestricted(userOutlet, resourceOutlet) {
  return request.auth != null && isAdmin() || userOutlet == resourceOutlet;
}
```

Due to operator precedence (`&&` binds tighter than `||`), this evaluates as:
```
(request.auth != null && isAdmin()) || (userOutlet == resourceOutlet)
```

The function returns `true` when the user IS an admin, so `!isOutletRestricted()` denies admins. Meanwhile a non-admin user where `userOutlet == resourceOutlet` also gets `true` returned, so they are also denied. Neither group can read dish images.

Worse, there is no catch-all `allow read: if false` for these paths, so the default Firebase Storage deny kicks in — but the logic is semantically wrong and will behave unexpectedly if the function is reused or refactored.

**Fix:**

```javascript
// storage.rules — corrected isOutletRestricted and read rules
match /{outlet}/dishes/{dishId}/{allPaths=**} {
  allow read: if request.auth != null && 
    (isAdmin() || request.auth.token.outlet == outlet);
  allow write: if isAdmin();
}

match /{outlet}/categories/{catId}/{allPaths=**} {
  allow read: if request.auth != null && 
    (isAdmin() || request.auth.token.outlet == outlet);
  allow write: if isAdmin();
}
// Remove the isOutletRestricted function entirely — it is not needed.
```

---

### CRIT-3: `logs/marketplaceAudit` World-Writable Without Auth

**File:** `database.rules.json`

```json
"marketplaceAudit": {
  ".write": true,  // ← Anyone on the internet can write here
```

**Problem:** Any unauthenticated actor can write arbitrary data to the audit log. This defeats its purpose as a tamper-evident audit trail and can be used to flood the database with junk, corrupt audit history, or inject false audit events.

**Fix:**

```json
"marketplaceAudit": {
  ".write": "auth != null",
  ".indexOn": ["userId", "timestamp"]
}
```

If you need anonymous users to be audited, use a Firebase Cloud Function as a trusted intermediary — never allow public writes directly to audit nodes.

---

### CRIT-4: `superAdmin` Node Is Publicly Readable

**File:** `database.rules.json`

```json
"superAdmin": {
  ".read": true,  // ← Public
  ".write": "auth != null && ..."
}
```

**Problem:** Any unauthenticated user can read the entire `superAdmin` node, which likely contains platform configuration, business metadata, and potentially sensitive operational data.

**Fix:**

```json
"superAdmin": {
  ".read": "auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true)",
  ".write": "auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true)"
}
```

---

### CRIT-5: Hardcoded Admin Email Bypass in ShopAdmin Auth

**File:** `ShopAdmin/js/auth.js`, lines 116–131

```javascript
const SUPREME_ADMIN = "nexorasoftware@gmail.com";
const SUPER_ADMIN = "roshanisudha@gmail.com";

if (email === SUPREME_ADMIN) {
    adminData.isSuper = true;
    adminData.isSupreme = true;
    // ...
}
```

**Problem:** Admin elevation is based on email string comparison in client-side JavaScript. This means:
1. Any attacker who compromises these email accounts gets Supreme Admin access regardless of Firebase custom claims.
2. If Google sign-in is enabled on these accounts and lacks 2FA, phishing or credential stuffing yields full access.
3. The access control bypass lives in the browser — it cannot be trusted.
4. The constant `SUPREME_ADMIN` uses `nexorasoftware@gmail.com` but `Credential.md` shows `Nexorasoftwareagency@gmail.com` — these don't match, so the bypass may silently fail.

**Fix:** Remove the hardcoded email checks entirely. Use Firebase Custom Claims set by a trusted Cloud Function:

```javascript
// Cloud Function (server-side only)
await admin.auth().setCustomUserClaims(uid, { superadmin: true });

// ShopAdmin/js/auth.js — just check the claim
const token = await user.getIdTokenResult(true);
if (token.claims.superadmin) {
  adminData.isSuper = true;
}
```

---

## 🟠 HIGH — Logic Bugs

---

### HIGH-1: `orderId` Used Before It Is Declared

**File:** `Marketplace/src/services/orderService.ts`, line 97

```typescript
// Inside the try block, before newOrderRef is awaited:
await logMarketplaceAudit('COUPON_REDEEM', {
  couponCode: input.couponCode.toUpperCase(),
  orderId: orderId,  // ← 'orderId' does not exist yet at this point
  userId: input.userId  // ← input.userId is not part of PlaceOrderInput type
});
```

`orderId` is derived from `newOrderRef.key` later in the function (assigned to `finalOrder.id`). At the point of this audit log call inside the coupon block, `orderId` is `undefined`. Additionally, `input.userId` is not a field in the `PlaceOrderInput` type, so this silently passes `undefined`.

**Fix:**

```typescript
// Move the coupon audit log AFTER finalOrder is constructed, or use newOrderRef.key:
await logMarketplaceAudit('COUPON_REDEEM', {
  couponCode: input.couponCode.toUpperCase(),
  orderId: newOrderRef.key,
  userId: auth.currentUser?.uid
});
```

---

### HIGH-2: `walletService` Missing `db` Import

**File:** `Marketplace/src/services/walletService.ts`, line 1

```typescript
import { ref, update, push, get, runTransaction, serverTimestamp } from "firebase/database";
// Missing: import { db } from "@/lib/firebase";
```

`db` is used throughout the service (e.g., `ref(db, ...)`) but is never imported. This will throw a `ReferenceError: db is not defined` at runtime, crashing wallet credit and debit operations silently after order placement.

**Fix:**

```typescript
import { ref, update, push, get, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";  // ← Add this line
import { WalletTransaction } from "@/types";
import { logMarketplaceAudit } from "./auditService";
```

---

### HIGH-3: `isAvailable` Mapped from `stock` Incorrectly

**File:** `Marketplace/src/services/menuService.ts`, line 53

```typescript
isAvailable: dish.stock !== undefined ? dish.stock : true,
```

`dish.stock` is a number (e.g., `15`, `0`). When `stock` is `0` (out of stock), this assigns `0` to `isAvailable`, which is falsy — which happens to be correct. But when `stock` is `5`, this assigns `5` to `isAvailable`, which is truthy but is **not** a boolean. TypeScript infers `MenuItem.isAvailable` as `boolean`, so downstream code like `item.isAvailable === true` will fail for positive stock values, and `item.isAvailable && ...` may behave unexpectedly.

**Fix:**

```typescript
isAvailable: dish.isAvailable !== undefined 
  ? Boolean(dish.isAvailable) 
  : dish.stock !== undefined 
    ? dish.stock > 0 
    : true,
```

---

### HIGH-4: `OrderContext` Manages Orders in `localStorage` Instead of Firebase

**File:** `Marketplace/src/context/OrderContext.tsx`, `Marketplace/src/services/orderService.ts`

`loadOrders()` and `persistOrders()` read/write from `localStorage`. After an order is placed via `submitOrder()` (which writes to Firebase), the local order object is constructed with `userId: "user_me"` (hardcoded string) and stored in `localStorage`.

**Problems:**
- Orders are not fetched from Firebase on login — a user on a new device sees no order history.
- `userId: "user_me"` means the order is never associated with the real user.
- `persistOrders` silently truncates to 500,000 bytes if the storage is full — orders can vanish without error.
- `updateOrderStatus` in `OrderContext` only updates local state, not Firebase (it calls the local `persistOrders`, not the Firebase `updateOrderStatus`).

**Fix:**
1. Replace `loadOrders()` with a Firebase query: `businesses/${bid}/outlets/${oid}/orders` filtered by `phone` or by a `userId` index.
2. Replace `userId: "user_me"` with `auth.currentUser?.uid`.
3. Store `businessId` and `outletId` in the order written to `localStorage` so `updateOrderStatus` can find the Firebase path (this is partially done already).

---

### HIGH-5: ShopAdmin Reads from Legacy `pizza/orders` Path, Not SaaS Path

**File:** `ShopAdmin/js/features/orders.js`, lines 73–82

```javascript
['pizza', 'cake'].forEach(o => {
    const r = db.ref(`${o}/orders`);
    if (_ordersChildCb) r.off("child_added", _ordersChildCb);
    ...
});
// ...
const currentOrdersRef = Outlet.ref("orders");
// Outlet.ref resolves to businesses/{bid}/outlets/{oid}/orders
```

The listener **detach** logic uses legacy paths (`pizza/orders`, `cake/orders`) but the listener **attach** logic uses the new SaaS paths (`businesses/.../orders`). This means old listeners on the legacy paths are never properly detached — they continue consuming bandwidth and may fire ghost events.

Additionally, `Outlet.ref` falls back to `window.currentOutlet || sessionStorage.getItem('adminSelectedOutlet') || 'outlet_pizza'` — a string that is used as-is in the path. If a user manipulates `sessionStorage`, they could read orders from another outlet.

**Fix:** Remove the legacy `pizza/orders` and `cake/orders` detach loop. Track all active refs in module-level variables and detach them uniformly:

```javascript
if (_ordersChildCb && _ordersRef) {
    _ordersRef.off("child_added", _ordersChildCb);
    _ordersRef.off("child_changed", _ordersChangedCb);
}
```

---

### HIGH-6: Wallet Debit Race Condition — Order Placed Before Payment Confirmed

**File:** `Marketplace/src/pages/Checkout.tsx`, `handlePlaceOrder` function

```typescript
// 3. Place the order in database
const orderId = await placeOrder({ ... });

// 4. Deduct from wallet AFTER order is already placed
if (paymentMethod === "wallet") {
    await walletService.debitWallet(...);
}
```

If `debitWallet` fails (network error, insufficient balance that wasn't caught by the pre-check), the order is already in Firebase as "Placed" but no payment occurred. The rollback logic cancels the order, but this relies on the cancel call also succeeding — a second potential failure point.

**Fix:** Reverse the sequence. Use a Firebase Cloud Function or transaction to atomically: (1) debit the wallet and (2) create the order. If either fails, both are rolled back. At minimum, perform the wallet debit *before* writing the order to Firebase.

---

### HIGH-7: Coupon Usage Count Incremented Even If Order Fails

**File:** `Marketplace/src/services/orderService.ts`

```typescript
const newOrderRef = push(ref(db, path));
await set(newOrderRef, orderData);

if (input.couponCode) {
    // Increment coupon usedCount here — before we know if the full flow succeeded
    await update(..., { usedCount: increment(1) });
}
```

If stock decrement or subsequent operations fail and the user retries, the coupon `usedCount` has already been incremented. Over time, coupons will show as "used up" more quickly than they actually are.

**Fix:** Increment `usedCount` in a Cloud Function triggered on order creation, or use a multi-path Firebase `update()` to write the order and increment the coupon in a single atomic operation.

---

### HIGH-8: `STATUS_PIPELINE` Mismatch Between Marketplace and ShopAdmin

**File:** `Marketplace/src/services/orderService.ts` vs `ShopAdmin/js/features/orders.js`

Marketplace pipeline:
```
["Placed", "Confirmed", "Preparing", "Packed", "Out for Delivery", "Delivered"]
```

ShopAdmin pipeline:
```
["Placed", "Confirmed", "Preparing", "Cooked", "Ready", "Out for Delivery", "Reached Drop Location", "Delivered"]
```

**Problem:** ShopAdmin has statuses (`Cooked`, `Ready`, `Reached Drop Location`) that don't exist in the Marketplace. When ShopAdmin sets an order to `"Ready"`, the Marketplace Tracking page will show an unknown status or fall back to a default. The Marketplace `nextStatus()` function will skip directly from `Preparing` to `Out for Delivery`, missing intermediate kitchen states entirely.

**Fix:** Align the pipelines. Either adopt the ShopAdmin pipeline everywhere, or define a canonical `STATUS_PIPELINE` in `config/constants.js` and import it in both apps.

---

## 🟡 MEDIUM — Data Flow & State Issues

---

### MED-1: Dual Outlet Schema Causes Data Desync

**Files:** `database.rules.json`, `ShopAdmin/js/firebase.js`, `Marketplace/src/services/menuService.ts`

There are **two parallel schemas** for outlet data:

- **Legacy (top-level):** `Pizza-Shop/`, `Cake-Shop/` — used by ShopAdmin's `Outlet.ref()` when `window.currentOutlet` is `"pizza"` or `"cake"`.
- **SaaS (nested):** `businesses/{bid}/outlets/{oid}/` — used by Marketplace and the bot.

`menuService.ts` tries both paths in a waterfall, meaning a menu update in the SaaS path might be shadowed by stale data in the legacy path. Orders written by the bot go to the SaaS path but are read by ShopAdmin via the legacy path if the outlet switcher value doesn't resolve correctly.

**Fix:** Migrate completely to the SaaS path. Run the existing `scripts/migrate-legacy-data.js` script if it covers all nodes. Add a `database.rules.json` rule to deny writes to `Pizza-Shop` and `Cake-Shop` once migration is complete.

---

### MED-2: `AuthContext` — Race Condition Between Redirect and State Change

**File:** `Marketplace/src/context/AuthContext.tsx`, `initAuth` function

```typescript
const initAuth = async () => {
    const redirectUser = await handleRedirectResult();
    if (redirectUser) {
        setUser(redirectUser);
        setAuthState("authenticated");
    }
    // finally block:
    if (!lastUser && hasStateChanged && !user) {  // ← 'user' is stale closure
        setAuthState("unauthenticated");
    }
};
```

The `finally` block references `user` from the closure captured at the time `initAuth` was created. This is always `null` (the initial state). The condition `!user` is always true, so if `hasStateChanged` is true and `lastUser` is null (user logged out), `authState` is correctly set to `"unauthenticated"`. But if `lastUser` is set (user is logged in) and the redirect also returned a user, the `finally` block is short-circuited correctly. However, this logic is fragile — a React `StrictMode` double-invoke can produce unexpected behavior.

**Fix:** Use a `ref` instead of closure state, or restructure the flow using a single `onAuthStateChanged` listener and handle the redirect result as a one-time effect:

```typescript
useEffect(() => {
    let mounted = true;
    handleRedirectResult().catch(console.error);
    
    const unsub = subscribeToAuthChanges((u) => {
        if (!mounted) return;
        setUser(u);
        setAuthState(u ? "authenticated" : "unauthenticated");
        if (u) requestNotificationPermission(u.id);
    });
    return () => { mounted = false; unsub(); };
}, []);
```

---

### MED-3: Cart Persisted to Firebase Without Coupon in `appliedCoupon` Dependency

**File:** `Marketplace/src/context/CartContext.tsx`

```typescript
useEffect(() => {
    // Persists cart to Firebase
}, [state.items, state.outletId, authState, user]);
//  ↑ state.appliedCoupon is NOT in the dependency array
```

When a coupon is applied (`state.appliedCoupon` changes), the cart is not re-persisted to Firebase. If the user closes the tab after applying a coupon but before changing items, the coupon is lost on next load.

**Fix:**

```typescript
}, [state.items, state.outletId, state.appliedCoupon, authState, user]);
```

---

### MED-4: `User` Type Has `recentTransactions` but `AuthContext` Populates `walletHistory`

**File:** `Marketplace/src/types/index.ts` vs `Marketplace/src/context/AuthContext.tsx`

```typescript
// types/index.ts
export type User = {
  recentTransactions: WalletTransaction[];  // ← field name
  // walletHistory is not in the type
};

// AuthContext.tsx
setUser(prev => ({
  ...prev,
  walletHistory: [...],  // ← writes to a field that doesn't exist in the type
}));
```

`walletHistory` is set on the user object at runtime but not declared in the `User` type. TypeScript will silently drop this since spread allows extra properties into the intermediate object. Any component reading `user.walletHistory` will get `undefined` and `user.recentTransactions` will always be the initial empty array.

**Fix:** Rename `recentTransactions` to `walletHistory` in `types/index.ts`, or rename the assignment in `AuthContext.tsx` to match `recentTransactions`.

---

## 🟡 MEDIUM — Missing Error Handling

---

### ERR-1: `Checkout.tsx` — No Form Validation Before Order Submission

**File:** `Marketplace/src/pages/Checkout.tsx`, `handlePlaceOrder`

There is no validation of the delivery form fields before calling `placeOrder`. A user can submit with empty name, phone, or address. The order is written to Firebase with blank fields, and the ShopAdmin receives an order it cannot fulfill.

**Fix:** Add validation before `setIsProcessing(true)`:

```typescript
const handlePlaceOrder = async () => {
    if (!user) return;
    if (!form.name.trim()) return alert("Please enter your name.");
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.trim())) {
        return alert("Please enter a valid 10-digit phone number.");
    }
    if (!form.address.trim()) return alert("Please enter a delivery address.");
    // ...
};
```

---

### ERR-2: `walletService.getWalletData` — Missing `db` (Same as HIGH-2)

**File:** `Marketplace/src/services/walletService.ts`

`getWalletData` uses `ref(db, ...)` but `db` is not imported. This function is referenced in the Profile page wallet display — the wallet balance will never load.

---

### ERR-3: `menuService` — `fetchMenuByOutlet` Silently Returns Empty on Repeated Legacy Fallbacks

**File:** `Marketplace/src/services/menuService.ts`

The function tries 4 paths sequentially using `await get()` for each. If the SaaS paths exist but have no `dishes` node (e.g., a newly created outlet), it falls through to `Pizza-Shop` and `Cake-Shop` legacy fallbacks — returning another outlet's menu. The user sees the wrong restaurant's food.

**Fix:** Return early with an empty array (and a meaningful log) if the correct SaaS path exists but has no dishes, instead of continuing to fallback paths:

```typescript
const saasSnap = await get(ref(db, `businesses/${businessId}/outlets/${outletId}`));
if (saasSnap.exists()) {
    const dishes = saasSnap.val().dishes || {};
    return Object.keys(dishes).map(id => mapLegacyDish(id, dishes[id], outletId, businessId, outletName));
    // ↑ Return here regardless, even if empty. Don't fall through to other outlets.
}
```

---

### ERR-4: Bot Session Cache Is Never Evicted

**File:** `bot/whatsapp-engine.js`

```javascript
const sessionCache = {};
// Sessions are added on every message but never removed
```

The in-memory `sessionCache` object grows indefinitely as users interact with the bot. On a long-running EC2 instance, this will cause a memory leak that eventually crashes the Node process.

**Fix:** Use a `Map` with TTL eviction:

```javascript
const SESSION_TTL = 30 * 60 * 1000; // 30 minutes
const sessionCache = new Map();

function setSession(jid, data) {
    sessionCache.set(jid, { data, expiry: Date.now() + SESSION_TTL });
}

function getSessionFromCache(jid) {
    const entry = sessionCache.get(jid);
    if (!entry) return null;
    if (Date.now() > entry.expiry) { sessionCache.delete(jid); return null; }
    return entry.data;
}

// Periodic cleanup
setInterval(() => {
    const now = Date.now();
    for (const [jid, entry] of sessionCache) {
        if (now > entry.expiry) sessionCache.delete(jid);
    }
}, 10 * 60 * 1000);
```

---

## 🟢 LOW — Dead Code, Structural Issues, and Cleanup

---

### LOW-1: Missing `.firebaserc`

**File:** Root directory

`firebase.json` defines hosting targets (`marketplace`, `admin`, `rider`, `superadmin`) but `.firebaserc` is absent. `firebase deploy` will fail with "Cannot find project" unless the user has manually run `firebase use`. Add `.firebaserc`:

```json
{
  "projects": {
    "default": "food-hubbie"
  },
  "targets": {
    "food-hubbie": {
      "hosting": {
        "marketplace": ["foodhubbie"],
        "admin": ["foodhubbie-admin"],
        "rider": ["foodhubbie-rider"],
        "superadmin": ["foodhubbie-superadmin"]
      }
    }
  }
}
```

---

### LOW-2: NPM Workspaces Declared for Non-Workspace Apps

**File:** `package.json`

`workspaces` lists `ShopAdmin`, `RiderApp`, and `SuperAdmin`, but none of them have a `package.json`. NPM will warn or error on `npm install --workspaces`. Only `Marketplace`, `bot`, `shared`, and `config` are valid workspace packages.

**Fix:**

```json
"workspaces": [
    "Marketplace",
    "bot",
    "shared",
    "config"
]
```

---

### LOW-3: `App Check` / reCAPTCHA Not Configured

**Files:** `ShopAdmin/firebase-config.js`, `config/firebase-config.js`

```javascript
window.reCaptchaSiteKey = "YOUR_RECAPTCHA_SITE_KEY"; // TODO
export const RECAPTCHA_SITE_KEY = "YOUR_RECAPTCHA_SITE_KEY";
```

Firebase App Check is unfinished. Until configured, bot/scraper abuse of Firebase endpoints is uninhibited. Register a reCAPTCHA v3 key at console.google.com and replace the placeholder.

---

### LOW-4: Debug/Dev Scripts Committed to Root

**Files:** `find-pizza.js`, `list-biz.js`, `test-db.js`, `sanity-check.js`, `extract_data.py`, `extract_pizza_data.py`, `search_json.py`, `ingest-pizza-data.js`, `sync-pizza-menus.js`

These are one-off development scripts committed to the root of the repository. They reference live Firebase credentials via the config and could be accidentally executed. Move them to `scripts/dev/` and add that directory to `.gitignore`, or delete them if they are no longer needed.

---

### LOW-5: `Checkout.tsx` Renders Saved Addresses Without Null Check

**File:** `Marketplace/src/pages/Checkout.tsx`, line ~165

```typescript
{(user.savedAddresses || []).map((addr) => (
```

This is inside the main render path, but appears *before* the `if (authState === "unauthenticated")` guard. If `authState` is `"loading"` and `user` is null, this will throw. Reorder the early returns so `loading` and `unauthenticated` states are handled before any user-dependent JSX.

---

### LOW-6: `User` Type Missing `walletHistory` (Structural)

Already described in MED-4. Structural fix needed in `types/index.ts`.

---

### LOW-7: `generate.md` and `design-system/` Are Documentation Artifacts, Not Source

**Files:** `generate.md`, `design-system/foodhubbie-supreme-admin/MASTER.md`

These appear to be AI-generated design/prompt documents. They contain no executable code and should not be in the repository root. Move to a `docs/` folder.

---

## Summary Table

| ID | Severity | File(s) | Issue |
|----|----------|---------|-------|
| CRIT-1 | 🔴 Critical | `Credential.md` | Plaintext SuperAdmin password in repo |
| CRIT-2 | 🔴 Critical | `storage.rules` | `isOutletRestricted` logic inverted, blocks legit users |
| CRIT-3 | 🔴 Critical | `database.rules.json` | `logs/marketplaceAudit` world-writable (no auth) |
| CRIT-4 | 🔴 Critical | `database.rules.json` | `superAdmin` node publicly readable |
| CRIT-5 | 🔴 Critical | `ShopAdmin/js/auth.js` | Hardcoded email → Super Admin bypass in client JS |
| HIGH-1 | 🟠 High | `orderService.ts` | `orderId` used before declaration in coupon audit |
| HIGH-2 | 🟠 High | `walletService.ts` | `db` not imported — wallet crashes at runtime |
| HIGH-3 | 🟠 High | `menuService.ts` | `isAvailable` mapped from numeric `stock`, not boolean |
| HIGH-4 | 🟠 High | `OrderContext.tsx` | Orders stored in localStorage, not fetched from Firebase |
| HIGH-5 | 🟠 High | `orders.js` | Legacy path used for listener detach; SaaS path for attach |
| HIGH-6 | 🟠 High | `Checkout.tsx` | Wallet debit after order write — payment race condition |
| HIGH-7 | 🟠 High | `orderService.ts` | Coupon `usedCount` incremented before order completion |
| HIGH-8 | 🟠 High | Both apps | Status pipeline mismatch (6 statuses vs 8 statuses) |
| MED-1 | 🟡 Medium | Multiple | Dual outlet schema (legacy + SaaS) causes desync |
| MED-2 | 🟡 Medium | `AuthContext.tsx` | Auth redirect race condition, stale closure |
| MED-3 | 🟡 Medium | `CartContext.tsx` | `appliedCoupon` missing from persistence `useEffect` deps |
| MED-4 | 🟡 Medium | `types/index.ts` | `recentTransactions` vs `walletHistory` field name mismatch |
| ERR-1 | 🟡 Medium | `Checkout.tsx` | No form validation before order submission |
| ERR-2 | 🟡 Medium | `walletService.ts` | Same as HIGH-2 — `db` missing in `getWalletData` too |
| ERR-3 | 🟡 Medium | `menuService.ts` | Wrong outlet menu shown via excessive legacy fallback |
| ERR-4 | 🟡 Medium | `whatsapp-engine.js` | Bot session cache never evicted — memory leak |
| LOW-1 | 🟢 Low | Root | `.firebaserc` missing — deploy will fail |
| LOW-2 | 🟢 Low | `package.json` | Workspaces include apps without `package.json` |
| LOW-3 | 🟢 Low | Config files | App Check / reCAPTCHA not configured |
| LOW-4 | 🟢 Low | Root | Dev/debug scripts committed to repo root |
| LOW-5 | 🟢 Low | `Checkout.tsx` | Null-check missing before early return ordering |
| LOW-6 | 🟢 Low | `types/index.ts` | Structural field name mismatch |
| LOW-7 | 🟢 Low | Root | Design/doc artifacts in repo root |

---

## Recommended Fix Priority

**This week (before any new users):**
1. CRIT-1 — Rotate password, purge `Credential.md` from git history
2. CRIT-3 — Add auth requirement to `marketplaceAudit`
3. CRIT-4 — Restrict `superAdmin` read
4. HIGH-2 — Add `db` import to `walletService.ts` (5-minute fix, prevents all wallet crashes)
5. HIGH-1 — Fix `orderId` reference in coupon audit log

**This sprint:**
6. CRIT-2 — Fix storage rules `isOutletRestricted` logic
7. CRIT-5 — Remove hardcoded email bypass, use custom claims
8. HIGH-3 — Fix `isAvailable` boolean mapping
9. HIGH-6 — Reverse wallet debit / order write sequence
10. HIGH-8 — Unify status pipeline
11. MED-3 — Add `appliedCoupon` to cart persistence deps
12. MED-4 — Align `walletHistory` / `recentTransactions` field name
13. ERR-1 — Add checkout form validation
14. LOW-1 — Add `.firebaserc`

**Next sprint:**
15. HIGH-4 — Migrate orders to Firebase-backed state
16. HIGH-5 — Fix ShopAdmin listener path mismatch
17. HIGH-7 — Atomicize coupon increment with order write
18. MED-1 — Complete migration to SaaS schema, retire legacy paths
19. MED-2 — Refactor auth init to avoid stale closure
20. ERR-3 — Remove over-eager menu fallback
21. ERR-4 — Add TTL eviction to bot session cache
22. LOW-2 through LOW-7 — Cleanup

---

*End of Audit Report — Food-Hubbie SaaS Platform*
