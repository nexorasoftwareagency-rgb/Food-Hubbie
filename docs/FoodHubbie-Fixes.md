# Food-Hubbie — Complete Fix Codes

> **Status:** 📜 HISTORICAL — Fix catalog for `FoodHubbie-Audit-Report.md` issues. All listed fixes were applied.  
> **Date:** May 20–21, 2026  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/FoodHubbie-Audit-Report.md` (original issues) · `docs/PHASE0-10-VERIFICATION-CHECKLIST.md` (verification of fixes) · `docs/00-master/00-INDEX.md` (current docs)

Every fix corresponds to an issue in the Audit Report. Copy-paste ready.

---

## CRIT-1 · Delete `Credential.md` and purge from git history

```bash
# Run these commands in your repo root — ONE TIME
git rm Credential.md
git commit -m "security: remove plaintext credentials"

# Purge from ALL past commits (requires git-filter-repo)
pip install git-filter-repo
git filter-repo --path Credential.md --invert-paths --force

# Force-push to remote (co-ordinate with all contributors)
git push origin --force --all
git push origin --force --tags
```

> After running: **immediately rotate** `Nexorasoftwareagency@gmail.com` password in Firebase Console → Authentication.

---

## CRIT-2 · `storage.rules` — Fix inverted `isOutletRestricted` logic

**Replace the entire file with:**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // Helper: check admin custom claim
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }

    // ADMINS: Full access
    match /admins/{adminId}/{allPaths=**} {
      allow read, write: if isAdmin();
    }

    // RIDERS: Admin write, self/admin read
    match /riders/{riderId}/{allPaths=**} {
      allow read: if request.auth != null && (isAdmin() || request.auth.uid == riderId);
      allow write: if isAdmin();
    }

    // BOT: WhatsApp order/status images
    match /bot/{allPaths=**} {
      allow read: if isAdmin();
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // OUTLET DISHES: Authenticated + same outlet OR admin
    match /{outlet}/dishes/{dishId}/{allPaths=**} {
      allow read: if request.auth != null &&
        (isAdmin() || request.auth.token.outlet == outlet);
      allow write: if isAdmin();
    }

    // OUTLET CATEGORIES: Authenticated + same outlet OR admin
    match /{outlet}/categories/{catId}/{allPaths=**} {
      allow read: if request.auth != null &&
        (isAdmin() || request.auth.token.outlet == outlet);
      allow write: if isAdmin();
    }

    // RECEIPTS: Admin only
    match /receipts/{orderId}/{allPaths=**} {
      allow read, write: if isAdmin();
    }

    // USER PROFILES: Self or admin
    match /users/{uid}/{allPaths=**} {
      allow read: if request.auth != null && (isAdmin() || request.auth.uid == uid);
      allow write: if isAdmin();
    }

    // DEFAULT: Deny everything else
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## CRIT-3 · `database.rules.json` — Restrict `marketplaceAudit` write

**Find this block:**
```json
"marketplaceAudit": {
  ".write": true,
  ".indexOn": ["userId", "timestamp"]
},
```

**Replace with:**
```json
"marketplaceAudit": {
  ".write": "auth != null",
  ".indexOn": ["userId", "timestamp"]
},
```

---

## CRIT-4 · `database.rules.json` — Restrict `superAdmin` read

**Find this block:**
```json
"superAdmin": {
  ".read": true,
  ".write": "auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true)"
}
```

**Replace with:**
```json
"superAdmin": {
  ".read": "auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true)",
  ".write": "auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true)"
}
```

---

## CRIT-5 · `ShopAdmin/js/auth.js` — Remove hardcoded email bypass

**Find and DELETE this entire block (~lines 114–135):**
```javascript
// --- Tiered Access Logic Injection ---
const email = user.email.toLowerCase();
const SUPREME_ADMIN = "nexorasoftware@gmail.com";
const SUPER_ADMIN = "roshanisudha@gmail.com";

if (email === SUPREME_ADMIN) {
    console.log("[Auth] Supreme Admin Detected");
    if (!adminData) adminData = { name: "Supreme Admin", email: SUPREME_ADMIN };
    adminData.isSuper = true;
    adminData.isSupreme = true;
    adminData.role = "Supreme Admin";
    if (!adminData.outlet) adminData.outlet = "pizza";
} else if (email === SUPER_ADMIN) {
    console.log("[Auth] Super Admin Detected");
    if (!adminData) adminData = { name: "Super Admin", email: SUPER_ADMIN };
    adminData.isSuper = true;
    adminData.role = "Super Admin";
} else if (adminData) {
    adminData.isSuper = false;
    adminData.isSupreme = false;
}
```

**Replace with (claim-based check):**
```javascript
// --- Tiered Access via Firebase Custom Claims ONLY ---
try {
    const token = await user.getIdTokenResult(true); // force-refresh
    if (token.claims.superadmin === true) {
        if (!adminData) adminData = { name: "Super Admin", email: user.email };
        adminData.isSuper = true;
        adminData.role = adminData.role || "Super Admin";
        if (!adminData.outlet) adminData.outlet = "outlet_pizza";
    } else if (adminData) {
        adminData.isSuper = false;
        adminData.isSupreme = false;
    }
} catch (claimsErr) {
    console.error("[Auth] Claims fetch failed:", claimsErr);
}
```

> **Also create** a Firebase Cloud Function to set custom claims on designated admin UIDs — this is what grants `superadmin: true` going forward. Example:

```javascript
// functions/src/index.ts (Cloud Function — server side only)
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export const setSuperAdminClaim = functions.https.onCall(async (data, context) => {
    // Only callable by existing superadmins
    if (!context.auth?.token.superadmin) {
        throw new functions.https.HttpsError("permission-denied", "Not authorized.");
    }
    const { uid } = data;
    await admin.auth().setCustomUserClaims(uid, { superadmin: true, admin: true });
    return { success: true };
});
```

---

## HIGH-1 · `Marketplace/src/services/orderService.ts` — Fix `orderId` used before declaration

**Find this block inside `submitOrder` (inside the coupon `if` block):**
```typescript
await logMarketplaceAudit('COUPON_REDEEM', {
  couponCode: input.couponCode.toUpperCase(),
  orderId: orderId,
  userId: input.userId
});
```

**Replace with:**
```typescript
await logMarketplaceAudit('COUPON_REDEEM', {
  couponCode: input.couponCode.toUpperCase(),
  orderId: newOrderRef.key,
  userId: auth.currentUser?.uid ?? 'anonymous'
});
```

---

## HIGH-2 & ERR-2 · `Marketplace/src/services/walletService.ts` — Add missing `db` import

**Find line 1 (current imports):**
```typescript
import { ref, update, push, get, runTransaction, serverTimestamp } from "firebase/database";
import { WalletTransaction } from "@/types";
import { logMarketplaceAudit } from "./auditService";
```

**Replace with:**
```typescript
import { ref, update, push, get, runTransaction, serverTimestamp } from "firebase/database";
import { db } from "@/lib/firebase";
import { WalletTransaction } from "@/types";
import { logMarketplaceAudit } from "./auditService";
```

> This single line fixes both HIGH-2 (`debitWallet` / `creditWallet` crashes) and ERR-2 (`getWalletData` crash).

---

## HIGH-3 · `Marketplace/src/services/menuService.ts` — Fix `isAvailable` boolean mapping

**Find (line ~53 inside `mapLegacyDish`):**
```typescript
isAvailable: dish.stock !== undefined ? dish.stock : true,
```

**Replace with:**
```typescript
isAvailable: dish.isAvailable !== undefined
  ? Boolean(dish.isAvailable)
  : dish.stock !== undefined
    ? dish.stock > 0
    : true,
```

---

## HIGH-4 · `Marketplace/src/services/orderService.ts` — Fix hardcoded `userId` and add Firebase order fetch

**Find inside `submitOrder`, the `finalOrder` object construction:**
```typescript
const finalOrder: Order = {
  id: newOrderRef.key || "unknown",
  userId: "user_me",   // ← hardcoded
  ...
};
```

**Replace with:**
```typescript
const finalOrder: Order = {
  id: newOrderRef.key || "unknown",
  userId: auth.currentUser?.uid ?? "anonymous",
  ...
};
```

**Then add a new exported function to fetch orders from Firebase (add at the bottom of the file):**
```typescript
/** Fetch orders for the current user from Firebase */
export async function fetchOrdersFromFirebase(userId: string): Promise<Order[]> {
  const orders: Order[] = [];
  try {
    // Fetch all businesses and scan their outlets for this user's orders
    const { get, ref, query, orderByChild, equalTo } = await import("firebase/database");
    const bizSnap = await get(ref(db, "businesses"));
    if (!bizSnap.exists()) return [];

    const businesses = bizSnap.val();
    const userPhone = auth.currentUser?.phoneNumber ?? "";

    for (const bid in businesses) {
      const outlets = businesses[bid]?.outlets ?? {};
      for (const oid in outlets) {
        const ordersSnap = await get(ref(db, `businesses/${bid}/outlets/${oid}/orders`));
        if (!ordersSnap.exists()) continue;
        ordersSnap.forEach((child) => {
          const data = child.val();
          // Match by userId or phone fallback
          if (data.userId === userId || data.phone === userPhone) {
            orders.push({
              id: child.key!,
              userId,
              outletId: oid,
              outletName: data.outletName || "Restaurant",
              businessId: bid,
              items: data.cart?.map((c: any) => ({
                menuItemId: c.id,
                name: c.name,
                image: c.image || "",
                quantity: c.qty,
                price: c.price,
              })) ?? [],
              subtotal: data.subtotal ?? data.total,
              deliveryFee: data.deliveryFee ?? 0,
              taxes: data.taxes ?? 0,
              total: data.total,
              status: data.status,
              statusHistory: data.statusHistory
                ? Object.values(data.statusHistory)
                : [{ status: data.status, timestamp: data.createdAt }],
              paymentMethod: data.paymentMethod,
              deliveryAddress: {
                name: data.customerName,
                phone: data.phone,
                address: data.address,
                lat: data.lat ?? 0,
                lng: data.lng ?? 0,
              },
              couponCode: data.couponCode,
              couponDiscount: data.couponDiscount,
              platformFee: data.platformFee,
              cashbackBonus: data.cashbackBonus,
              estimatedMinutes: 35,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("[OrderService] fetchOrdersFromFirebase error:", err);
  }
  return orders.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

**Then update `Marketplace/src/context/OrderContext.tsx`** — replace `useState<Order[]>(() => loadOrders())` with a Firebase-backed load:

```typescript
// At the top of OrderProvider, replace the orders useState:
const { user, authState } = useAuth();  // add this import if not present
const [orders, setOrders] = useState<Order[]>([]);
const [isLoadingOrders, setIsLoadingOrders] = useState(true);

// Add this useEffect after the existing state declarations:
useEffect(() => {
  if (authState === "authenticated" && user) {
    setIsLoadingOrders(true);
    fetchOrdersFromFirebase(user.id)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setIsLoadingOrders(false));
  } else if (authState === "unauthenticated") {
    setOrders([]);
    setIsLoadingOrders(false);
  }
}, [authState, user?.id]);
```

> Add `useAuth` import from `"../context/AuthContext"` and `fetchOrdersFromFirebase` from `"@/services/orderService"` at the top of `OrderContext.tsx`.

---

## HIGH-5 · `ShopAdmin/js/features/orders.js` — Fix legacy path used in listener detach

**Find this block at the top of `initRealtimeListeners()`:**
```javascript
['pizza', 'cake'].forEach(o => {
    const r = db.ref(`${o}/orders`);
    if (_ordersChildCb) r.off("child_added", _ordersChildCb);
    if (_ordersChangedCb) r.off("child_changed", _ordersChangedCb);
});
```

**Replace with:**
```javascript
// Detach from the previously tracked SaaS reference only
if (_ordersRef) {
    if (_ordersChildCb) _ordersRef.off("child_added", _ordersChildCb);
    if (_ordersChangedCb) _ordersRef.off("child_changed", _ordersChangedCb);
    if (_ordersValueCb) _ordersRef.off("value", _ordersValueCb);
    _ordersRef = null;
    _ordersValueCb = null;
}
if (_liveOrdersRef && _liveOrdersValueCb) {
    _liveOrdersRef.off("value", _liveOrdersValueCb);
    _liveOrdersRef = null;
    _liveOrdersValueCb = null;
}
_ordersChildCb = null;
_ordersChangedCb = null;
```

---

## HIGH-6 · `Marketplace/src/pages/Checkout.tsx` — Fix wallet debit / order write race condition

**Find `handlePlaceOrder` and restructure the wallet-payment flow:**

```typescript
const handlePlaceOrder = async () => {
  if (!user) return;

  // --- Form validation ---
  if (!form.name.trim()) return alert("Please enter your full name.");
  if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
    return alert("Please enter a valid 10-digit Indian phone number.");
  if (!form.address.trim()) return alert("Please enter your delivery address.");

  // --- Wallet pre-check and PRE-DEBIT before order is written ---
  if (paymentMethod === "wallet") {
    if ((user.walletBalance || 0) < summary.total) {
      alert("Insufficient wallet balance. Please choose another payment method.");
      return;
    }
    setIsProcessing(true);
    try {
      // Debit FIRST — before order creation
      await walletService.debitWallet(
        user.id,
        summary.total,
        `Order Payment — pending confirmation`,
        undefined
      );
    } catch (walletErr) {
      console.error("Wallet pre-debit failed:", walletErr);
      alert("Wallet payment failed. Please try again or choose another method.");
      setIsProcessing(false);
      return;
    }
  } else {
    setIsProcessing(true);
  }

  try {
    const subtotal = cartState.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const globalDiscountAmount = globalDiscount
      ? globalDiscount.type === "percent"
        ? Math.round(subtotal * (globalDiscount.value / 100))
        : globalDiscount.value
      : 0;
    const couponDiscount = cartState.appliedCoupon
      ? cartState.appliedCoupon.type === "percent"
        ? Math.round(subtotal * (cartState.appliedCoupon.value / 100))
        : cartState.appliedCoupon.value
      : 0;
    const bonusAmount = projectedBonus;

    // Place the order
    const orderId = await placeOrder({
      outletId: cartState.outletId ?? "",
      items: cartState.items,
      subtotal: summary.subtotal,
      deliveryFee: summary.deliveryFee,
      taxes: summary.taxes,
      total: summary.total,
      discount: summary.savings,
      couponCode: cartState.appliedCoupon?.code,
      couponDiscount,
      globalDiscountAmount,
      paymentMethod,
      deliveryAddress: form,
      platformFee: summary.platformFee,
      cashbackBonus: bonusAmount,
    });

    // Update wallet transaction description with real orderId
    // (credit back is handled separately; the debit already went through)

    // Credit Cashback Bonus
    if (bonusAmount > 0) {
      try {
        await walletService.creditWallet(
          user.id,
          bonusAmount,
          `2% Order Cashback Reward (#${orderId.slice(-6).toUpperCase()})`,
          orderId
        );
      } catch (bonusErr) {
        console.error("Bonus credit failed:", bonusErr);
        const { markCashbackPending } = await import("@/services/orderService");
        await markCashbackPending(orderId, bonusAmount);
      }
    }

    cartDispatch({ type: "CLEAR_CART" });
    setLocation(`/tracking/${orderId}`);
  } catch (err) {
    console.error("Checkout error:", err);
    // If order creation failed and wallet was pre-debited, refund it
    if (paymentMethod === "wallet") {
      try {
        await walletService.creditWallet(
          user.id,
          summary.total,
          "Refund — order creation failed",
          undefined
        );
      } catch (refundErr) {
        console.error("Refund failed — contact support:", refundErr);
      }
    }
    alert("Something went wrong while placing your order. Please try again.");
  } finally {
    setIsProcessing(false);
  }
};
```

---

## HIGH-7 · `Marketplace/src/services/orderService.ts` — Fix coupon increment timing

**Find the coupon increment block inside `submitOrder`:**
```typescript
if (input.couponCode) {
    try {
        const { increment } = await import("firebase/database");
        const couponRef = ref(db, `system/promotions/coupons/...`);
        await update(..., { usedCount: increment(1) });
        await logMarketplaceAudit('COUPON_REDEEM', { ... });
    } catch (cErr) { ... }
}
```

**Move this entire block to AFTER `finalOrder` is constructed and persisted, and gate it on successful order write:**

```typescript
// --- After persistOrders(finalOrder, ...currentOrders) ---

// Increment coupon usedCount ONLY after order is fully persisted
if (input.couponCode) {
    try {
        const { increment } = await import("firebase/database");
        await update(ref(db, `system/promotions/coupons/${input.couponCode.toUpperCase()}`), {
            usedCount: increment(1)
        });
        await logMarketplaceAudit('COUPON_REDEEM', {
            couponCode: input.couponCode.toUpperCase(),
            orderId: finalOrder.id,
            userId: auth.currentUser?.uid ?? 'anonymous'
        });
    } catch (cErr) {
        // Non-fatal: log but don't fail the order
        console.error("Coupon increment failed (non-fatal):", cErr);
    }
}
```

---

## HIGH-8 · Unify status pipeline across Marketplace and ShopAdmin

**Create/update `config/constants.js`:**
```javascript
// config/constants.js

/**
 * Canonical order status pipeline — used by ALL apps.
 * Marketplace, ShopAdmin, RiderApp, and Bot must all import from here.
 */
const ORDER_STATUS_PIPELINE = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Cooked",
  "Ready",
  "Out for Delivery",
  "Reached Drop Location",
  "Delivered"
];

const ORDER_STATUS_CANCELLED = "Cancelled";

const STATUS_MAPPING = {
  "Placed": 0,
  "Confirmed": 1,
  "Preparing": 2,
  "Cooked": 3,
  "Ready": 4,
  "Out for Delivery": 5,
  "Reached Drop Location": 6,
  "Delivered": 7,
  "Cancelled": -1
};

if (typeof module !== 'undefined') {
  module.exports = { ORDER_STATUS_PIPELINE, ORDER_STATUS_CANCELLED, STATUS_MAPPING };
}
```

**Update `Marketplace/src/services/orderService.ts`** — replace hardcoded pipeline:
```typescript
// Remove:
export const STATUS_PIPELINE = ["Placed", "Confirmed", "Preparing", "Packed", "Out for Delivery", "Delivered"];

// Add at top of file:
export const STATUS_PIPELINE = [
  "Placed",
  "Confirmed",
  "Preparing",
  "Cooked",
  "Ready",
  "Out for Delivery",
  "Reached Drop Location",
  "Delivered"
] as const;
```

**Update `Marketplace/src/pages/Tracking.tsx`** — add missing stage icons for new statuses:
```typescript
import { CheckCircle2, Clock, ChefHat, PackageCheck, Bike, Home, UtensilsCrossed, MapPin } from "lucide-react";

const stageIcons: Record<string, typeof CheckCircle2> = {
  Placed: CheckCircle2,
  Confirmed: Clock,
  Preparing: ChefHat,
  Cooked: UtensilsCrossed,
  Ready: PackageCheck,
  "Out for Delivery": Bike,
  "Reached Drop Location": MapPin,
  Delivered: Home,
  Cancelled: CheckCircle2,
};

const stageMessages: Record<string, string> = {
  Placed: "Your order has been received.",
  Confirmed: "The restaurant confirmed your order.",
  Preparing: "The chef is working their magic.",
  Cooked: "Your food is freshly cooked!",
  Ready: "Packed and ready for pickup.",
  "Out for Delivery": "Your rider is on the way!",
  "Reached Drop Location": "Rider has arrived at your location.",
  Delivered: "Enjoy your meal!",
};
```

---

## MED-1 · `database.rules.json` — Block writes to legacy top-level shop nodes

Add these rules to deny further writes to the legacy schema (after migration is complete):

```json
"Pizza-Shop": {
  ".read": true,
  ".write": false
},

"Cake-Shop": {
  ".read": true,
  ".write": false
}
```

> Run `scripts/migrate-legacy-data.js` before applying this, so all data is moved to `businesses/` first.

---

## MED-2 · `Marketplace/src/context/AuthContext.tsx` — Fix auth init race condition

**Replace the entire `useEffect(() => { ... }, [])` block:**

```typescript
useEffect(() => {
  let mounted = true;

  // Handle one-time redirect result (no-op if using popup sign-in)
  handleRedirectResult().catch((err) => {
    console.error("[AuthContext] Redirect result error:", err);
  });

  // Single source of truth: onAuthStateChanged
  const unsubscribe = subscribeToAuthChanges((u) => {
    if (!mounted) return;
    if (u) {
      setUser(u);
      setAuthState("authenticated");
      requestNotificationPermission(u.id);
    } else {
      setUser(null);
      setAuthState("unauthenticated");
    }
  });

  return () => {
    mounted = false;
    unsubscribe();
  };
}, []);
```

---

## MED-3 · `Marketplace/src/context/CartContext.tsx` — Add `appliedCoupon` to persistence deps

**Find the persist-cart `useEffect` dependency array:**
```typescript
}, [state.items, state.outletId, authState, user]);
```

**Replace with:**
```typescript
}, [state.items, state.outletId, state.appliedCoupon, authState, user]);
```

---

## MED-4 · `Marketplace/src/types/index.ts` — Fix `walletHistory` field name

**Find in the `User` type:**
```typescript
export type User = {
  ...
  recentTransactions: WalletTransaction[]; // Lightweight alternative
  ...
};
```

**Replace with:**
```typescript
export type User = {
  ...
  walletHistory: WalletTransaction[];
  ...
};
```

> `authService.ts` already uses `walletHistory: []` in `mapFirebaseUser` — this aligns the type to match.  
> Do a project-wide search for `recentTransactions` and rename any remaining references.

---

## ERR-1 · `Marketplace/src/pages/Checkout.tsx` — Add form validation

This fix is **included inside HIGH-6** above. The `handlePlaceOrder` replacement already includes full form validation at the top of the function.

---

## ERR-3 · `Marketplace/src/services/menuService.ts` — Fix over-eager legacy fallback

**Replace the entire `fetchMenuByOutlet` function:**

```typescript
export async function fetchMenuByOutlet(
  outletId: string,
  businessId: string = "business_roshani"
): Promise<MenuItem[]> {
  try {
    // 1. Try primary SaaS path
    const saasSnap = await get(ref(db, `businesses/${businessId}/outlets/${outletId}`));
    if (saasSnap.exists()) {
      const data = saasSnap.val();
      const outletName = data.settings?.Store?.storeName || data.meta?.name || "Restaurant";
      const dishes = data.dishes || (data.menu?.items) || {};
      // Return whatever is here — even if empty. Do NOT fall through to other outlets.
      return Object.keys(dishes).map((id) =>
        mapLegacyDish(id, dishes[id], outletId, businessId, outletName)
      );
    }

    // 2. Try root-level outlets node (secondary SaaS path)
    const outletSnap = await get(ref(db, `outlets/${outletId}`));
    if (outletSnap.exists()) {
      const data = outletSnap.val();
      const outletName = data.name || "Restaurant";
      const dishes = data.dishes || {};
      return Object.keys(dishes).map((id) =>
        mapLegacyDish(id, dishes[id], outletId, businessId, outletName)
      );
    }

    // 3. Legacy fallback — ONLY for known legacy outlet IDs
    const LEGACY_MAP: Record<string, string> = {
      outlet_pizza: "Pizza-Shop",
      outlet_cake: "Cake-Shop",
    };
    const legacyNode = LEGACY_MAP[outletId];
    if (legacyNode) {
      const legacySnap = await get(ref(db, legacyNode));
      if (legacySnap.exists()) {
        const data = legacySnap.val();
        const dishes = data.dishes || data.Menu?.Items || data.menu?.items || {};
        const outletName = data.settings?.Store?.storeName || legacyNode;
        return Object.keys(dishes).map((id) =>
          mapLegacyDish(id, dishes[id], outletId, businessId, outletName)
        );
      }
    }

    console.warn(`[MenuService] No dishes found for outlet: ${outletId}`);
    return [];
  } catch (err) {
    console.error("[MenuService] fetchMenuByOutlet error:", err);
    return [];
  }
}
```

---

## ERR-4 · `bot/whatsapp-engine.js` — Fix session cache memory leak

**Replace the top of the file (session cache section):**

```javascript
// Replace:
const sessionCache = {};

// With:
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const sessionCache = new Map();

function getCachedSession(jid) {
    const entry = sessionCache.get(jid);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        sessionCache.delete(jid);
        return null;
    }
    return entry.data;
}

function setCachedSession(jid, data) {
    sessionCache.set(jid, { data, expiry: Date.now() + SESSION_TTL_MS });
}

// Evict expired sessions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [jid, entry] of sessionCache) {
        if (now > entry.expiry) sessionCache.delete(jid);
    }
}, 10 * 60 * 1000);
```

**Then update `persistSession` and `getSession` to use the new helpers:**

```javascript
async function persistSession(jid, session) {
    try {
        const safeJid = jid.replace(/\./g, ',');
        const path = `system/botSessions/${BUSINESS_ID}/${OUTLET_ID}/${safeJid}`;
        await setData(path, session);
        setCachedSession(jid, session);  // ← was: sessionCache[jid] = session
    } catch (err) {
        console.error(`[Session] Failed to persist for ${jid}:`, err.message);
    }
}

async function getSession(jid) {
    const cached = getCachedSession(jid);  // ← was: if (sessionCache[jid])
    if (cached) return cached;

    try {
        const safeJid = jid.replace(/\./g, ',');
        const path = `system/botSessions/${BUSINESS_ID}/${OUTLET_ID}/${safeJid}`;
        const session = await getData(path);
        if (session) {
            setCachedSession(jid, session);  // ← was: sessionCache[jid] = session
            return session;
        }
    } catch (err) {
        console.error(`[Session] Failed to load for ${jid}:`, err.message);
    }
    return null;
}
```

**Also update the `handleIncomingMessage` line that sets session directly:**
```javascript
// Find:
sessionCache[senderJid] = user;

// Replace with:
setCachedSession(senderJid, user);
```

---

## LOW-1 · Add missing `.firebaserc`

Create `.firebaserc` in the repository root:

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

## LOW-2 · `package.json` — Fix workspaces list

**Find:**
```json
"workspaces": [
  "ShopAdmin",
  "RiderApp",
  "Marketplace",
  "SuperAdmin",
  "bot",
  "shared",
  "config"
]
```

**Replace with:**
```json
"workspaces": [
  "Marketplace",
  "bot",
  "shared",
  "config"
]
```

> `ShopAdmin`, `RiderApp`, and `SuperAdmin` are plain HTML/JS apps — they have no `package.json` and cannot be NPM workspaces.

---

## LOW-3 · Configure App Check / reCAPTCHA

**In `config/firebase-config.js`**, replace the placeholder:
```javascript
// Remove:
export const RECAPTCHA_SITE_KEY = "YOUR_RECAPTCHA_SITE_KEY";

// Replace with your actual key from console.cloud.google.com → reCAPTCHA:
export const RECAPTCHA_SITE_KEY = "6Lc_YOUR_ACTUAL_SITE_KEY_HERE";
```

**In `ShopAdmin/firebase-config.js`**, same change:
```javascript
// Remove:
window.reCaptchaSiteKey = "YOUR_RECAPTCHA_SITE_KEY";

// Replace with:
window.reCaptchaSiteKey = "6Lc_YOUR_ACTUAL_SITE_KEY_HERE";
```

**In `ShopAdmin/js/init-appcheck.js`**, ensure App Check is initialized with the real key (it already references `window.reCaptchaSiteKey` — no other change needed once the key is set above).

---

## LOW-4 · Move dev scripts out of repo root

```bash
mkdir -p scripts/dev
mv find-pizza.js list-biz.js test-db.js sanity-check.js \
   ingest-pizza-data.js sync-pizza-menus.js \
   extract_data.py extract_pizza_data.py search_json.py \
   scripts/dev/

# Add to .gitignore:
echo "scripts/dev/" >> .gitignore
git add .gitignore
git commit -m "chore: move dev scripts to scripts/dev and gitignore them"
```

---

## LOW-5 · `Marketplace/src/pages/Checkout.tsx` — Fix null-check ordering

**Move the `authState` guard BEFORE the `cartState.items.length` guard at the bottom of the component:**

```typescript
// CORRECT ORDER for early returns — place these BEFORE the main return:

// 1. Auth check first (user may be null)
if (authState === "loading") {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

if (authState === "unauthenticated") {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* ...existing unauthenticated UI... */}
    </div>
  );
}

// 2. Empty cart check (user is now guaranteed non-null)
if (cartState.items.length === 0 && !isProcessing) {
  return (
    <div className="container mx-auto p-8 text-center">
      <p className="text-muted-foreground mb-4">No items to checkout.</p>
      <Link href="/" className="text-primary font-bold">Go Home</Link>
    </div>
  );
}

// 3. Main render (user and cart are both valid)
return ( ... );
```

---

## LOW-6 · `Marketplace/src/types/index.ts` — covered by MED-4 above

No additional changes needed beyond what MED-4 specifies.

---

## LOW-7 · Move doc artifacts to `docs/`

```bash
mkdir -p docs
mv generate.md design-system/ docs/
git add docs/ 
git rm generate.md
git rm -r design-system/
git commit -m "chore: move design docs to docs/ folder"
```

---

*End of Fix Codes — Food-Hubbie SaaS Platform*
