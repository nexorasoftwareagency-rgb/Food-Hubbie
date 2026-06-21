# Roshani Pizza Bot — Legacy Imported System

**Source repo**: `github.com/nexorasoftwareagency-rgb/roshani-pizza-bot.git`  
**Imported to**: `D:\Foodhubbie\roshani-pizza-bot\`  
**Original architecture**: Dual-outlet ERP (Pizza + Cake) — WhatsApp bot + Admin Dashboard + Rider Portal  
**Status**: Superseded by Foodhubbie multi-tenant bot, but preserved for reference

---

## 1. Code-Logics

### Repo Structure
```
roshani-pizza-bot/
├── Admin/                     -- Admin Dashboard (Firebase Hosting: admin)
│   ├── index.html             -- SPA shell with all tab sections
│   ├── init.js                -- Firebase init + global helpers
│   ├── branding.js            -- Multi-outlet CSS theming (pizza vs cake)
│   ├── receipt-templates.js   -- Thermal receipt HTML (hardcoded "ROSHANI PIZZA")
│   ├── style.css              -- Main styles
│   ├── sw.js                  -- Service Worker
│   ├── firebase-messaging-sw.js
│   ├── manifest-pizza.json / manifest-cake.json
│   ├── firebase-config.js     -- Firebase config
│   ├── mobile-overrides.css   -- Mobile-specific CSS
│   └── js/
│       ├── main.js            -- Entry (imports all feature modules)
│       ├── auth.js            -- Firebase Auth (login, logout, session, idle 30min)
│       ├── state.js           -- Global state object
│       ├── firebase.js        -- Firebase SDK exports
│       ├── utils.js           -- Utility functions
│       ├── ui.js              -- Tab switching, sidebar, theme toggle
│       ├── pwa.js             -- PWA install, nuclear refresh
│       ├── gestures.js        -- Touch gesture handling
│       ├── l10n.js            -- Localization
│       ├── capacity-fcm.js, fcm-init.js, fcm-sender.js  -- FCM push notifications
│       └── features/          -- 15 feature modules
│           ├── orders.js      -- Order management + status flow
│           ├── catalog.js     -- Dishes + Categories CRUD
│           ├── riders.js      -- Rider management
│           ├── pos.js         -- Walk-in POS
│           ├── settings.js    -- Store settings
│           ├── customers.js   -- Customer reports
│           ├── notifications.js -- System alert history
│           ├── tracker.js     -- Live rider map (Leaflet)
│           ├── feedback.js    -- Feedback display
│           ├── inventory.js   -- Stock tracking
│           ├── inventory-extras.js
│           ├── rider-analytics.js -- Per-rider performance
│           ├── lost-sales.js  -- Abandoned checkout tracking
│           ├── analytics.js   -- Sales report + Chart.js + Excel/PDF export
│           └── printing.js    -- Thermal receipt printing
│
├── rider/                     -- Rider Portal (Firebase Hosting: rider)
│   ├── index.html             -- SPA shell
│   ├── login.html             -- Standalone login page
│   ├── app.js                 -- Full rider app logic
│   ├── style.css              -- Rider styles
│   ├── sw.js                  -- Service Worker
│   ├── manifest.json
│   ├── firebase-messaging-sw.js
│   └── assets/
│       └── sounds/alert.mp3  -- New order ping
│
├── bot/                       -- WhatsApp Bot (EC2 - PM2)
│   ├── index.js               -- Main bot logic (1929 lines)
│   ├── firebase.js            -- Firebase Admin SDK (cached reads/writes)
│   ├── package.json
│   ├── service-account.json
│   ├── session_data_pizza/    -- WhatsApp auth (auto-generated)
│   ├── session_data_cake/     -- WhatsApp auth (auto-generated)
│   └── ecosystem.config.js    -- PM2 for this directory
│
├── ecosystem.config.js        -- Root PM2 (pizza-bot + cake-bot)
├── firebase.json              -- Firebase Hosting (admin + rider targets)
├── database.rules.json        -- RTDB security rules
├── storage.rules              -- Storage rules
├── capacitor-admin/           -- Capacitor native wrapper (Android)
│   ├── capacitor.config.ts
│   └── package.json
├── capacitor-rider/           -- Capacitor native wrapper (Android)
│   ├── android/
│   ├── capacitor.config.ts
│   └── package.json
├── graphify-out/              -- Dependency graph (auto-generated)
│   ├── graph.html, graph.json, cost.json, manifest.json, cache/
├── scripts/
│   └── generate_successful_man_image.py
└── *.md                       -- README, SERVER_GUIDE, deployment_guide
```

### Admin Dashboard — 18 Screens
| Screen | Feature module | Lines (approx) |
|---|---|---|
| Dashboard | `main.js` + `ui.js` | 200+ (KPI cards, priority orders, recent orders, rider status) |
| Orders | `orders.js` | 400+ (filter, search, status change, rider assignment, print) |
| Live Ops | `orders.js` | Real-time kitchen display |
| POS | `pos.js` | Walk-in/dine-in: browse menu, cart, discount, print |
| Menu Mgmt | `catalog.js` | CRUD dishes: name, price, image, sizes, add-ons, visibility |
| Categories | `catalog.js` | CRUD categories: name, image, sort, add-ons |
| Rider Mgmt | `riders.js` | CRUD: name, Aadhar, photos, status, stats |
| Customers | `customers.js` | Search, order history, lifetime value |
| Lost Sales | `lost-sales.js` | Abandoned checkout tracking |
| Analytics | `analytics.js` | Date-range sales, Chart.js trend, Excel/PDF export |
| Rider Analytics | `rider-analytics.js` | Per-rider deliveries, earnings, settle balance |
| Feedback | `feedback.js` | Ratings and reviews linked to orders |
| Live Tracker | `tracker.js` | Leaflet map of online rider positions (30s GPS) |
| Notifications | `notifications.js` | System alert history |
| Inventory | `inventory.js` | Stock tracking with low-stock thresholds |
| Payments | `inventory-extras.js` | Payment transaction records |
| Settings | `settings.js` | Store info, hours, delivery fee slabs, bot images |
| Sidebar utilities | `pwa.js` + `ui.js` | Theme toggle, PWA install, Nuclear Refresh, Logout |

### Bot (1929 lines) — Key Architectural Differences from Foodhubbie

| Aspect | Roshani Pizza Bot | Foodhubbie Bot |
|---|---|---|
| Tenancy | Single outlet per process (OUTLET env var) | Multi-tenant (system/bot_routing/ registry) |
| PM2 | 2 processes (pizza-bot + cake-bot) | 1 process (foodhubbie-bot) |
| Session | In-memory object (`sessionCache = {}`) — no eviction | Map with 30min TTL + periodic cleanup |
| Redis | Required for production (session + dedup + OTP) | Not used (Firebase-based persistence) |
| Fallback | In-memory Map if Redis unavailable (+ constant) | N/A (Firebase is the source of truth) |
| Report scheduling | Heartbeat every 5min, checks IST time | reports-cron with Crash Safety (persistent timestamps) |
| Image handling | Firebase download URLs per status from settings/Bot | Same |
| Inventory | Matches item names against inventory/ node on order | Same |
| OTP | 10 attempts → 60s block | Same |
| File structure | Single monolithic index.js (1929L) | Modular: multi-tenant.js + whatsapp-engine.js + status-monitor.js + commands.js |

### Rider Portal — 6 Screens
Same pattern as Foodhubbie's RiderApp but in vanilla JS with 500m geofence (vs 1km/300m dual gates).

### Capacitor Native Wrappers
Both Admin and Rider have Capacitor configs (`capacitor.config.ts`) for Android native app builds:
- `capacitor-admin/` — Wraps the Admin Dashboard as a native Android app
- `capacitor-rider/` — Wraps the Rider Portal as a native Android app (with android/ directory)

---

## 2. Firebase-Rules

Legacy RTDB structure (partitioned by outlet rather than `businesses/{bid}/outlets/{oid}`):

```
pizza/orders/{orderId}    ← read/write by admin + bot
cake/orders/{orderId}     ← read/write by admin + bot
pizza/dishes/{dishId}     ← read by customer, write by admin
cake/dishes/{dishId}
pizza/categories/
cake/categories/
pizza/settings/
cake/settings/
admins/{uid}
riders/{uid}
bot/{outlet}/commands/
bot/{outlet}/status/
botUsers/{cleanJid}
customers/{phone}
riderStats/{riderId}
settlements/{uid}
otpAttempts/{orderId}
logs/
```

---

## 3. Database-Structure

Per-outlet document (pizza/ or cake/):
```
orders/{orderId}
  orderId, outlet, type, status, customerName, phone, whatsappNumber
  address, lat, lng
  items[]: { name, size, unitPrice, quantity, addons[], total }
  subtotal, deliveryFee, total, paymentMethod, paymentStatus
  deliveryOTP, riderId, riderPhone, riderName
  createdAt, deliveredAt

dishes/{dishId}
  name, price, category, image, sizes{}, addons[], description, order, stock

categories/{catId}
  name, image, order, addons[]
```

---

## 4. Connecting-Nodes

Same as Foodhubbie bot architecture but with:
- Redis cache for sessions (TTL: `session:{sender}` 30min, `status:{id}` 24h, `otp:{phone}` 5min)
- Dual PM2 processes sharing one codebase, differentiated by `OUTLET=pizza` or `OUTLET=cake`
- Admin Dashboard uses `Outlet.ref()` which resolves to `pizza/` or `cake/` based on `window.currentOutlet`

---

## 5. Migration Path to Foodhubbie

1. Legacy RTDB schema (`pizza/`, `cake/`) → migrated to `businesses/{bid}/outlets/{oid}/`
2. Single-process bot (`bot/index.js` 1929L) → split into multi-tenant orchestrator + engine + monitor
3. Redis dependency → replaced by Firebase `system/botSessions/` node + per-engine Map cache
4. Dual PM2 → single process with tenant registry
5. Admin Dashboard (vanilla JS) → `admin-dashboard/` React SPA
6. Rider Portal → `RiderApp/` with improved proximity gating and offline queue
7. Capacitor native wrappers → deprecated (PWA covers mobile install)
