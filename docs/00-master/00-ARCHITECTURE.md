# Foodhubbie — System Architecture (C4 Model)

## Context (Level 1)

```
[CUSTOMER] ----WhatsApp---> [WhatsApp Bot (EC2 + PM2)]
    |                            |
    | --Browser--> [Marketplace PWA (foodhubbie.web.app)]
    |                            |
    |                            v
    |                    [Firebase Realtime Database]
    |                            |
    +----> [Admin Dashboard (foodhubbie-admin.web.app)]
    |       [Rider App (foodhubbie-rider.web.app)]
    |       [SuperAdmin (foodhubbie-superadmin.web.app)]
    |       [SupremeAdmin (foodhubbie-supremeadmin.web.app)]
    |
    +----> [Redis]  <--- [WhatsApp Bot] (session cache, dedup)
```

### Actors
| Actor | Portal | Auth method |
|---|---|---|
| Customer | Marketplace PWA | Google Sign-In (Firebase Auth) |
| Customer | WhatsApp Bot | WhatsApp phone number |
| Shop Admin | Admin Dashboard | Email/password (Firebase Auth) |
| Rider | Rider App | `{phone}@rider.com` + password (Firebase Auth) |
| Super Admin | SuperAdmin | Email/password + TOTP 2FA |
| Supreme Admin | SupremeAdmin | Email/password (Firebase Auth) |

---

## Container (Level 2)

### Marketplace (`foodhubbie-marketplace.web.app`)
- **Stack**: React 19 + TypeScript 5.9 + Vite 6 + Tailwind 4 + wouter
- **PWA**: Service worker + manifest + push notifications
- **Deploy**: `firebase deploy --only hosting:marketplace`
- **Source**: `Marketplace/src/`

### Admin Dashboard (`foodhubbie-admin.web.app`)
- **Stack**: React 18 + Vite 7 + Tailwind 4 + recharts + lucide-react
- **Deploy**: `firebase deploy --only hosting:admin`
- **Source**: `admin-dashboard/src/`

### Rider App (`foodhubbie-rider.web.app`)
- **Stack**: Vanilla JS ES modules + Firebase CDN (modular v10.7.1) + Leaflet.js
- **PWA**: `sw.js` + `firebase-messaging-sw.js` + manifest
- **Deploy**: `firebase deploy --only hosting:rider`
- **Source**: `RiderApp/`

### SuperAdmin (`foodhubbie-superadmin.web.app`)
- **Stack**: Vanilla JS + Firebase CDN (compat v9.6.1) + Chart.js + SweetAlert2 + otpauth + QRCode.js + html2pdf
- **Deploy**: `firebase deploy --only hosting:superadmin`
- **Source**: `SuperAdmin/`

### SupremeAdmin (`foodhubbie-supremeadmin.web.app`)
- **Stack**: Vanilla JS + Firebase CDN (compat v11.4.0: RTDB + Firestore + Functions) + Chart.js v4.4.7
- **Deploy**: `firebase deploy --only hosting:supreme`
- **Source**: `SupremeAdmin/`

### WhatsApp Bot (EC2)
- **Stack**: Node.js 18+ CommonJS + Baileys v6.7.17 + firebase-admin v13.10.0 + pino
- **Process**: PM2 (`foodhubbie-bot`, single process, multi-tenancy via `multi-tenant.js`)
- **Memory**: 600M max, exp-backoff restart
- **Source**: `bot/`

### Firebase Services
| Service | Usage |
|---|---|
| Authentication | Email/password + Google Sign-In |
| Realtime Database | All app data (orders, dishes, riders, users, system) |
| Cloud Storage | Dish images, rider profile photos, receipts |
| Cloud Messaging | Push notifications to riders + admins |
| Cloud Firestore | SupremeAdmin only (compat via Firestore) |
| Cloud Functions | SupremeAdmin only (compat via Functions) |
| App Check | reCAPTCHA v3 (client-side initialized, console-enforced for RTDB) |

---

## Component (Level 3)

### Marketplace Component Map
```
src/
  App.tsx ─── Router (wouter)
    ├── providers: AuthProvider, LocationProvider, CartProvider, OrderProvider
    ├── layout: AppLayout (header, main, bottom nav)
    ├── pages: 11 pages (Home, Search, Outlets, OutletDetails, Cart, Checkout, Tracking, Profile, Orders, Login, not-found)
    ├── services: 12 modules (auth, order, cart, menu, outlet, delivery, wallet, notification, promotion, review, audit, config)
    ├── contexts: 4 modules (Auth, Cart, Location, Order)
    ├── components: layout/, cards/, modals/, ui/, ErrorBoundary, NotificationHandler
    ├── hooks: 2 (use-toast, use-mobile)
    ├── lib: 3 (firebase.ts, utils.ts, deliveryFee.ts)
    └── types: 1 (index.ts — 25 domain types)
```

### Admin Dashboard Component Map
```
src/
  App.jsx ─── (3572 lines, no JSX router — uses PAGES object)
    ├── shared components: 13 (Avatar, BtnPrimary, GlassCard, KPICard, Modal, Toast, etc.)
    ├── sections: 19 functions (Dashboard, Orders, LiveOps, Kitchen, POS, Menu, Categories, Inventory, Customers, Riders, Partners, Analytics, LostSales, Settlements, Notifications, Feedback, LiveTracker, Settings)
    ├── hooks: 1 (useRealtimeData)
    ├── utils: 4 (constants, formatters, printing, validators)
    └── firebase.js: 228L — init, App Check, secondary auth, audit log, image upload
```

### Bot Component Map
```
bot/
  index.js ─── (14L — delegates to multi-tenant.js)
  multi-tenant.js ─── (186L — registry loader, socket factory, orchestrator)
    └── per tenant:
        ├── whatsapp-engine.js ─── (706L — 11-step state machine)
        ├── status-monitor.js ─── (307L — 8 status handlers)
        ├── commands.js ─── (130L — command listener)
        ├── reports-cron.js ─── (320L — IST scheduled reports)
        ├── audit.js ─── (41L — bot audit logger)
  firebase.js ─── (145L — tenantContext factory, global reads)
  create-admin.js ─── (55L — admin user creation)
```

### Legacy Roshani Pizza Bot Component Map
```
roshani-pizza-bot/
  Admin/ ─── Vanilla JS SPA
    ├── index.html ─── SPA shell
    ├── init.js / auth.js / state.js / utils.js / ui.js / pwa.js / branding.js
    ├── js/features/ ─── 15 feature modules (orders, catalog, riders, pos, etc.)
    └── js/utils/ ─── utility helpers
  rider/ ─── Vanilla JS PWA
    ├── index.html / login.html
    ├── app.js ─── full rider app logic
    ├── style.css / sw.js / manifest.json
  bot/
    └── index.js ─── (1929L — monolith, dual-outlet via OUTLET env var)
  capacitor-admin/ + capacitor-rider/ ─── native wrapper configs
```

---

## Code (Level 4) — File Dependency Graph

### Across-app shared config
```
config/
  index.js ─── re-exports
  firebase-config.js ─── consumed by: admin-dashboard, RiderApp, SuperAdmin, SupremeAdmin, bot
  constants.js ─── consumed by: all apps (via npm workspace @foodhubbie/config)
  theme-tokens.js ─── consumed by: Marketplace (theme.ts), bot
shared/
  index.js ─── re-exports
  firebase-helpers.js ─── resolvePath, cache layer, ops creators; consumed by: bot/firebase.js
  utils.js ─── calculateDistance, formatJid, isShopOpen, generateOTP; consumed by: bot/whatsapp-engine.js
  push-notifications.js ─── sendPushNotification, notifyAdmins; consumed by: bot/status-monitor.js
```

### Marketplace → Firebase write path
```
Checkout.tsx handlePlaceOrder()
  → cartService.calcCartSummary()
  → orderService.submitOrder() — validates businessId+outletId, applies commission config
    → push(ref(db, businesses/{bid}/outlets/{oid}/orders/{pushId}))
    → if wallet: walletService.debitWallet()
    → if coupon: coupon.usedCount += 1
    → logMarketplaceAudit('ORDER_PLACED', ...)
  → Admin Dashboard receives onValue → updates KOT
  → Bot status-monitor receives child_changed → sends WhatsApp
```

### Bot → WhatsApp → Firebase write path
```
multi-tenant.js boot
  → loadRegistry() reads system/bot_routing/
  → per tenant: makeWASocket() → createEngine(tenant) → initStatusMonitor(sock, tenant) → initCommandListener(sock, tenant)
  → WhatsApp message lands → whatsapp-engine.js state machine
    → sessionCache lookup → step handler (CATEGORY, DISH, SIZE, QUANTITY, CART_VIEW, LOCATION, CONFIRM_PAY)
    → on CONFIRM_PAY: submitOrder() → push to businesses/{bid}/outlets/{oid}/orders
    → on status change: status-monitor.js handleStatusUpdate()
      → sends WhatsApp message to customer with image per status
      → if rider assigned: sends WhatsApp to rider
      → if no rider: broadcasts to all online riders
```
