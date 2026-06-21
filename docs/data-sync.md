# Foodhubbie Data Sync Contract

> **Status:** Active (Phase 1 stabilization)  
> **Audience:** Platform team, all developers  
> **Last updated:** 2026-06-04  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/00-master/00-DATA-MODEL.md` (canonical RTDB tree) · `docs/03-foundation/03-Database-Security-Rules.md` (security rules) · `docs/03-foundation/03-Connectivity-Map.md` (end-to-end wiring)

This document is the single source of truth for **where data lives** in the Foodhubbie Realtime Database and **how every app reads / writes it**. Read it before adding a new feature that touches Firebase.

---

## 1. The canonical RTDB tree

```
/root
├── businesses/{bid}
│   └── outlets/{oid}
│       ├── orders/{pushId}        ← write by Marketplace / admin
│       ├── dishes/                ← read by Marketplace
│       ├── categories/            ← read by Marketplace
│       ├── settings (Store, Delivery, shopOpen, hours, fee slabs, location)
│       ├── reviews/, feedbacks/
│       ├── inventory/
│       ├── wallet/, settlements/, ledger/
│       ├── botCommands, botStatus, botUsers, otpAttempts, riderStats
│       └── meta (slug, logo, cover, rating, cuisine, tags, isVegOnly, featured, offers)
├── slugs/outlets/{slug} → { businessId, outletId }
├── users/{uid} (auth profile + cart + wallet + walletHistory + fcmToken)
├── customers/{uid} (legacy alias; prefer users/)
├── riders/{uid} (profile, wallet, ledger, notifications, location, fcmToken)
├── riderStats/{uid}
├── admins/{uid} (businessId, outletId, isSuper, tfaSecret, password)
├── onboarding_requests/{uid}
├── dishes/                  ← legacy read-only
├── outlets/                 ← legacy read-only
├── Pizza-Shop/, Cake-Shop/  ← legacy read-only
├── system/
│   ├── settings/delivery (mode, per100mRate, slabs)
│   ├── promotions/{coupons, surge, globalDiscount}
│   ├── config/platformFee
│   ├── broadcasts/
│   ├── admins/{uid}/tfaSecret
│   ├── auditLogs/, settlements/
│   └── botSessions/{bid}/{oid}/{jid}
├── platformConfig/
├── orders/                  (global index; mirror of per-outlet orders)
├── superAdmin/
├── errorLogs/
└── logs/{marketplaceAudit, botAudit, audit, lostSales, riderErrors}
```

---

## 2. The Order lifecycle (one happy path)

```
[Customer taps PAY on Marketplace /checkout]
   │  push → businesses/{bid}/outlets/{oid}/orders/{pushId}
   ▼
[admin-dashboard live-listens → KOT prints]
   │  onValue → admin updates status: Confirmed → Preparing → Cooked → Ready
   ▼
[RiderApp (within 1 km) picks up "Ready" order]
   │  runTransaction → set assignedRider + riderId + deliveryOTP
   │  push → bot/{bid}/{oid}/commands (SEND_GENERIC_MESSAGE "accepted")
   ▼
[bot (Node, Baileys) consumes command → sends WhatsApp to customer]
   │
[Customer shares OTP with rider]
   │
[RiderApp: confirmPickup → "Out for Delivery" → WhatsApp "picked up"]
   │
[RiderApp: reachedDropLocation → opens OTP panel → verify → PaymentSheet]
   │
[RiderApp: ledger entry → wallet transaction (runTransaction)]
   │  also: order → "Delivered"
   ▼
[SuperAdmin Financial Recon: aggregates → manual settlement → payouts]
   │
[Customer sees in /orders + /wallet cashback credited]
```

---

## 3. Multi-tenant invariants — the **only** rule that matters

> **Every order write must carry a `businessId` and an `outletId`. There is no global "default business".**

This is enforced at three layers:

1. **Type layer** — `PlaceOrderInput.businessId: string` (no `?`).
2. **Service layer** — `submitOrder()` in `Marketplace/src/services/orderService.ts` throws if either is empty.
3. **Bot layer** — `bot/firebase.js` hard-fails at startup if `FOODHUBBIE_BIZ_ID` / `FOODHUBBIE_OUTLET_ID` are unset.

### 3.1 Where `businessId` originates

- Read by the Marketplace from `Outlet.businessId` (returned by `outletService.fetchOutlets()`).
- Stored on every `CartItem` at the moment the user clicks "Add" (see `FoodCard.tsx` and `ProductCustomizationModal.tsx`).
- Surfaced in the cart state (`CartState.businessId`) and passed to `placeOrder()`.

### 3.2 Forbidden patterns

These will silently misroute orders — **do not add them back**:

- ❌ Hardcoded tenant IDs (`"business_roshani"`, `"business_prashant"`, `"pizza-parsa"`, `"outlet_pizza"`) in app code.
- ❌ Falling back to a default tenant if `businessId` is empty.
- ❌ Reading from legacy root paths (`Pizza-Shop/`, `Cake-Shop/`, `dishes/`, `outlets/`) when writing new data — they are read-only fallbacks.
- ❌ Re-deriving `businessId` from `outletId` alone (it is **not** 1:1 — the same `outletId` can exist under multiple businesses in theory).

### 3.3 Legacy read paths (intentional)

`menuService.fetchMenuByOutlet()` still falls back to `Pizza-Shop/`, `Cake-Shop/`, root `dishes/`, and root `outlets/` when the SaaS path is empty. This is for backward-compat with legacy outlets that haven't been migrated yet. **Never write to those paths.**

---

## 4. Slug management

- Every outlet that should be reachable at `https://<host>/store/{slug}` must have an entry at `slugs/outlets/{slug}` containing `{ businessId, outletId }`.
- Slugs are written by:
  - **`scripts/seed-business.js`** (programmatic; preferred for new onboarding)
  - **SuperAdmin onboarding form** (manual, one-off)
- Read by `outletService.fetchOutletBySlug()`.

---

## 5. Cross-app communication patterns

| Pattern | Where | When to use |
|---|---|---|
| RTDB `onValue` subscription | every app's service layer | Default — anything that needs live updates |
| RTDB `push` + `.key` predetermination | Checkout → order ID, wallet tx ref | When you need an ID **before** the write completes |
| `runTransaction` | `orderService` (order assignment, wallet), `walletService` (debit/credit) | When two clients might race for the same field |
| Command queue `bot/{bid}/{oid}/commands` | RiderApp → bot (WhatsApp) | One-way fire-and-forget messages |
| `onDisconnect` | RiderApp location, bot heartbeat | Auto-cleanup when a client disconnects |

---

## 6. Environment & secrets

| App | Env var(s) | Default | Notes |
|---|---|---|---|
| **bot** | `FOODHUBBIE_BIZ_ID` (or legacy `BUSINESS_ID`) | **required** — hard-exits on boot if missing | PM2 passes via `ecosystem.config.js` |
| **bot** | `FOODHUBBIE_OUTLET_ID` (or legacy `OUTLET_ID`) | **required** — hard-exits on boot if missing | |
| **bot** | `FIREBASE_DATABASE_URL` | from `config/firebase-config.js` | |
| **scripts/seed-business.js** | `SERVICE_ACCOUNT_PATH` | `<repo>/service-account.json` | Firebase Admin SDK service-account JSON |
| **scripts/sync-catalog.js** | `SERVICE_ACCOUNT_PATH` | `<repo>/service-account.json` | |

> The previous behavior — silently defaulting to `business_roshani` when env vars were missing — was a multi-tenant bug. It is now a hard-fail with a descriptive error message.

---

## 7. Onboarding a new business (runbook)

1. Create the admin user in Firebase Auth (email + password).
2. Add `admins/{uid}` with `isSuper: true` for the owner, or `businessId` / `outletId` for outlet-scoped staff.
3. Run the seeder:
   ```bash
   node scripts/seed-business.js \
     --biz=business_<slug> \
     --outlet=<outlet-id> \
     --slug=<public-slug> \
     --name="<Outlet Display Name>" \
     --entity="<Legal Entity>" \
     --address="<Full Address>" \
     --lat=<lat> --lng=<lng> \
     --fixture=<path-to-catalog.json>  # optional
   ```
4. Provision a bot instance by adding an entry to `bot/ecosystem.config.js` with the matching `FOODHUBBIE_BIZ_ID` and `FOODHUBBIE_OUTLET_ID`.
5. Add the theme override to `config/theme-tokens.js` under `tenants[bid]` if a custom brand palette is required.

---

## 8. Auditing & retention

- `system/auditLogs/` is the canonical audit trail (write-gated to super admin).
- `logs/marketplaceAudit`, `logs/botAudit`, `logs/riderErrors` are append-only intake buckets written by the respective app.
- Retention policies (orders / audit / settlements) are configured in the SuperAdmin **Infrastructure** tab — see `database.rules.json` for write-side enforcement.
