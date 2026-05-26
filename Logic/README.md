# Foodhubbie — Logic Knowledge Base

## Structure

```
Logic/
├── README.md                    ← You are here
├── Tech-Stack.md                ← Full technology stack across all apps
│
├── Shared/                      ← Cross-cutting shared modules
│   ├── 01-Code-Logics.md
│   ├── 02-Utility-Logics.md
│   ├── 03-Firebase-Database-Rules.md
│   ├── 04-Database-Structure.md
│   ├── 05-Connecting-Nodes.md
│   └── 06-Complete-Flows.md
│
├── Admin-Dashboard/             ← React 19 + Vite 8 SPA (foodhubbie-admin.web.app)
│   ├── 01-Code-Logics.md        ← Overview
│   ├── 02-Section-Utility-Logics.md
│   ├── 03-Firebase-Rules.md
│   ├── 04-Database-Structure.md
│   ├── 05-Connecting-Nodes.md
│   ├── 06-Complete-Flows.md
│   ├── index-html-Overview.md   ← Vite HTML entry point
│   ├── vite-config-Overview.md  ← Vite build config
│   │
│   └── {page}/                  ← Per-page docs (6 files each)
│       ├── Code-Logics.md
│       ├── Decisions.md
│       ├── Firebase-Rules.md
│       ├── Database-Structure.md
│       ├── Points.md
│       └── Complete-Flow.md
│
├── Bot/                         ← Node.js WhatsApp bot (EC2 + PM2)
│   ├── Entry/                   ← index.js — Connection lifecycle
│   │   └── (6 files)
│   ├── Status-Monitor/          ← status-monitor.js — Order listener & notifications
│   │   └── (6 files)
│   ├── Commands/                ← commands.js — Admin-triggered bot commands
│   │   └── (6 files)
│   ├── WhatsApp-Engine/         ← whatsapp-engine.js — Interactive ordering state machine
│   │   └── (6 files)
│   ├── Firebase/                ← firebase.js — Admin SDK initialization & wrappers
│   │   └── (6 files)
│   ├── Audit/                   ← audit.js — Bot activity logging
│   │   └── Overview.md
│   ├── create-admin-Overview.md ← Admin user creation script
│   ├── ecosystem-config-Overview.md ← PM2 multi-instance config
│   └── whatsapp-ordering-flow-Overview.md ← Pre-existing flow reference
│
├── Rider-App/                   ← Vanilla HTML/CSS/JS SPA (foodhubbie-rider.web.app)
│   ├── 01-Code-Logics.md        ← Overview — 7 views, 10+ modals
│   ├── 02-Features.md           ← Cross-cutting features
│   ├── 03-Firebase-Rules.md     ← Access patterns by role
│   ├── 04-Database-Structure.md ← Full schema (riders, orders, wallet)
│   ├── 05-Connecting-Nodes.md   ← View → app.js → Firebase flow
│   ├── 06-Complete-Flows.md     ← Full delivery lifecycle
│   ├── Service-Worker-Overview.md  ← sw.js + FCM SW + PWA manifest
│   ├── Auth-Flow-Overview.md    ← Login, session, logout
│   ├── Location-Tracking-Overview.md ← GPS watchPosition + onDisconnect
│   ├── Proximity-Gating-Overview.md  ← 1km/300m configurable gates
│   ├── Offline-Queue-Overview.md ← localStorage queue + sync
│   ├── OTP-System-Overview.md   ← 4-digit OTP, rate limiting, admin bypass
│   ├── firebase-config-Overview.md ← SDK imports, config object, init
│   ├── style-css-Overview.md   ← 3,979-line design system catalog
│   ├── login-html-Overview.md  ← Legacy standalone login page
│   │
│   └── Views/                   ← 7 views × 6 files each
│       ├── Home/                ← Dashboard with stats + active delivery
│       ├── Available/           ← Unassigned orders to accept
│       ├── Active/              ← Live trip with 4-step progress
│       ├── Completed/           ← Trip history with search
│       ├── Ledger/              ← Wallet, transactions, settlements
│       ├── Earnings/            ← Weekly chart, shop breakdown
│       └── Profile/             ← Photo, details, bank, aadhar
│
├── Marketplace/                 ← React 19 + TypeScript + Vite 6 PWA
│   ├── 01-Code-Logics.md        ← App structure, provider tree, router
│   ├── 02-Services.md           ← 12 service modules overview
│   ├── 03-Firebase-Rules.md     ← Access patterns by auth level
│   ├── 04-Database-Structure.md ← Full schema (users, orders, system)
│   ├── 05-Connecting-Nodes.md   ← Context → Service → Firebase flow
│   ├── 06-Complete-Flows.md     ← End-to-end user journey
│   │
│   ├── Types-Overview.md        ← All 25 domain types
│   │
│   ├── Pages/                   ← 11 pages × 6 files each
│   │   ├── Home/
│   │   ├── Search/
│   │   ├── Outlets/
│   │   ├── OutletDetails/
│   │   ├── Cart/
│   │   ├── Checkout/
│   │   ├── Tracking/
│   │   ├── Profile/
│   │   ├── Orders/
│   │   ├── Login/
│   │   └── not-found/
│   │
│   ├── Context/                 ← 4 context overviews
│   │   ├── AuthContext-Overview.md
│   │   ├── CartContext-Overview.md
│   │   ├── LocationContext-Overview.md
│   │   └── OrderContext-Overview.md
│   │
│   ├── Components/              ← 6 component overviews
│   │   ├── Layout-Overview.md
│   │   ├── Cards-Overview.md
│   │   ├── Modals-Overview.md
│   │   ├── UI-Components-Overview.md
│   │   ├── ErrorBoundary-Overview.md
│   │   └── NotificationHandler-Overview.md
│   │
│   └── Config/                  ← 4 config overviews
│       ├── theme-Overview.md
│       ├── vite-config-Overview.md
│       ├── index-html-Overview.md
│       └── tsconfig-Overview.md
│
│   ├── Hooks/                   ← 2 hook overviews
│   │   ├── toast-Overview.md
│   │   └── mobile-Overview.md
│   │
│   ├── Lib/                     ← 2 utility overviews
│   │   ├── deliveryFee-Overview.md
│   │   └── utils-Overview.md
│
├── SuperAdmin/                  ← Vanilla HTML/CSS/JS SPA (foodhubbie-superadmin.web.app)
│   ├── 01-Code-Logics.md        ← Overview — 17 tabs, 85+ functions, 4038-line main.js
│   ├── 02-Auth-RBAC.md          ← Auth flow, 2FA TOTP, 5-role RBAC permissions matrix
│   ├── 03-Firebase-Rules.md     ← 30+ paths, access by role
│   ├── 04-Database-Structure.md ← Full schema: system/, businesses, users, archives
│   ├── 05-Connecting-Nodes.md   ← Tab click → Firebase → render flow
│   ├── 06-Complete-Flows.md     ← Onboarding, reconciliation, live orders, retention
│   ├── firebase-config-Overview.md  ← v9.6.1 compat, dual instances
│   ├── style-css-Overview.md    ← 674-line green theme design system
│   ├── Pagination-Overview.md   ← Client-side pagination
│   ├── Toast-Overview.md        ← Toast notification system
│   ├── Security-Overview.md     ← XSS, CSV injection, rate limiting, atomic writes
│   ├── Data-Retention-Overview.md  ← 3 policy types (archive/purge)
│   ├── Two-Factor-Auth-Overview.md ← TOTP setup, QR code, verification
│   ├── Onboarding-Flow-Overview.md ← Partner approval pipeline
│   ├── Live-Orders-Engine-Overview.md ← Table/Kanban, SLA, drag-drop
│   ├── Reconciliation-Overview.md ← Settlement processing
│   ├── index-html-Overview.md  ← 1766-line SPA shell, auth gateway, modals
│   ├── libraries-Overview.md  ← Chart.js, SweetAlert2, OTPAuth, QRCode.js, html2pdf
│   ├── sidebar-nav-Overview.md ← data-tab routing, RBAC hiding, 3 nav groups
│   │
│   └── Views/                   ← 17 tabs × 6 files each
│       ├── Dashboard/           ← KPIs, heatmap, sparklines
│       ├── Onboarding/          ← Partner approval, provisioning
│       ├── Reconciliation/      ← Financial settlements
│       ├── Businesses/          ← Entity management
│       ├── Outlets/             ← Profiles + analytics
│       ├── Analytics/           ← Growth metrics
│       ├── Riders/              ← Fleet CRUD + KYC
│       ├── Delivery/            ← Fee configuration
│       ├── Inventory/           ← Stock control
│       ├── Promotions/          ← Surge, discounts, coupons
│       ├── Users/               ← Registry + wallet
│       ├── LiveOrders/          ← Pipeline table/Kanban
│       ├── Reviews/             ← Scoreboard + ratings
│       ├── Broadcast/           ← Notification center
│       ├── Audit/               ← Unified logs (4 sources)
│       ├── Reports/             ← KPIs, chart, export
│       └── Settings/            ← 2FA, telemetry, retention
│
└── SupremeAdmin/                ← Vanilla HTML/CSS/JS SPA (foodhubbie-supremeadmin.web.app)
    ├── Code-Logics.md            ← Overview — 15 tabs, 7 listeners, broken navigation
    ├── Section-Utility-Logics.md ← showTab, forms, pagination, chart builders
    ├── Firebase-Rules.md         ← All RTDB paths, no RBAC
    ├── Database-Structure.md     ← Full schema: businesses, users, riders, system
    ├── Connecting-Nodes.md       ← Firebase v11.4.0 compat, Chart.js, 3-file app
    ├── Complete-Flows.md         ← Auth, onboarding, settlements, retention
    │
    └── {tab}/                    ← 15 tabs × 6 files each
        ├── Dashboard/            ← KPIs, Charts.js revenue + orders, activity
        ├── Onboarding/           ← Approve/reject requests, provision modal
        ├── Businesses/           ← Searchable list, edit outlet, commission
        ├── Live-Orders/          ← Table + Kanban (broken init + view toggle)
        ├── Riders/               ← CRUD + Firebase Auth REST API
        ├── Users/                ← Wallet credit, history (broken), CSV export
        ├── Promotions/           ← Surge (works), discount/fee (broken), coupons
        ├── Settlements/          ← Per-order settlement, audit log
        ├── Delivery-Slabs/       ← prompt()-based editing, array storage
        ├── Inventory/            ← Stock transaction, availability toggle
        ├── Reviews/              ← Read-only star ratings, truncated comments
        ├── Broadcast/            ← Rate-limited push, audience targeting
        ├── Audit/                ← 4-path aggregation, paginated
        ├── Reports/              ← Metrics, top 10 outlets, CSV/PDF export
        └── Settings/             ← TFA (stub), data retention archive/purge
```

## Admin Dashboard — Pages Documented (19)

| Page | Subfolder | Status |
|---|---|---|
| Point of Sale | `POS/` | Complete |
| Orders | `Orders/` | Complete |
| Live Operations | `LiveOps/` | Complete |
| Kitchen Display | `Kitchen/` | Complete |
| Menu Management | `Menu/` | Complete |
| Categories | `Categories/` | Complete |
| Dashboard KPIs | `Dashboard/` | Complete |
| Customers | `Customers/` | Complete |
| Live Tracker | `LiveTracker/` | Complete |
| Settings | `Settings/` | Complete |
| Inventory | `Inventory/` | Mock-only |
| Riders | `Riders/` | Mock-only |
| Partners | `Partners/` | Mock-only |
| Analytics | `Analytics/` | Mock-only |
| Lost Sales | `LostSales/` | Mock-only |
| Settlements | `Settlements/` | Mock-only |
| Notifications | `Notifications/` | Mock-only |
| Feedback | `Feedback/` | Mock-only |
| Shared Components | `Shared-Components/` | Complete |

**Totals**: 6 overview + 2 config + 19 pages × 6 files = **122 files** (complete)

## Per-Page File Format

Every page subfolder contains these 6 files:

| File | Content |
|---|---|
| `Code-Logics.md` | State variables, handlers, computed values, validation logic, data flow |
| `Decisions.md` | Design decisions, trade-offs, rationale |
| `Firebase-Rules.md` | Firebase RTDB security rules specific to this page |
| `Database-Structure.md` | Schema, field types, example data, indexes |
| `Points.md` | Edge cases, gotchas, bugs, assumptions, future improvements |
| `Complete-Flow.md` | End-to-end user journey with step-by-step walkthrough |

## Bot — Modules Documented (5)

| Module | Subfolder | Files | Lines (source) |
|---|---|---|---|
| Entry (index.js) | `Entry/` | 6 | 96 |
| Status Monitor (status-monitor.js) | `Status-Monitor/` | 6 | 308 |
| Commands (commands.js) | `Commands/` | 6 | 128 |
| WhatsApp Engine (whatsapp-engine.js) | `WhatsApp-Engine/` | 6 | 682 |
| Firebase (firebase.js) | `Firebase/` | 6 | 134 |
| Audit (audit.js) | `Audit/` | 1 overview | 26 |

**Totals**: 5 modules × 6 files + 4 overviews = **34 files** (complete)

## Marketplace — Pages & Modules Documented

| Module | Subfolder | Files |
|---|---|---|
| Root overviews | — | 6 |
| Types | Types-Overview.md | 1 |
| Home | `Pages/Home/` | 6 |
| Search | `Pages/Search/` | 6 |
| Outlets | `Pages/Outlets/` | 6 |
| OutletDetails | `Pages/OutletDetails/` | 6 |
| Cart | `Pages/Cart/` | 6 |
| Checkout | `Pages/Checkout/` | 6 |
| Tracking | `Pages/Tracking/` | 6 |
| Profile | `Pages/Profile/` | 6 |
| Orders | `Pages/Orders/` | 6 |
| Login | `Pages/Login/` | 6 |
| not-found | `Pages/not-found/` | 6 |
| AuthContext | `Context/` | 1 |
| CartContext | `Context/` | 1 |
| LocationContext | `Context/` | 1 |
| OrderContext | `Context/` | 1 |
| Layout Components | `Components/` | 1 |
| Card Components | `Components/` | 1 |
| Modal Components | `Components/` | 1 |
| UI Components | `Components/` | 1 |
| Theme Config | `Config/` | 1 |
| Vite Config | `Config/` | 1 |
| index.html | `Config/` | 1 |

**Totals**: 6 root + 1 types + 66 pages + 4 contexts + 6 components + 4 config + 2 hooks + 2 lib = **91 files** (complete)

## Rider App — Views Documented (7)

| View | Subfolder | Files |
|---|---|---|
| Home Dashboard | `Views/Home/` | 6 |
| Available Orders | `Views/Available/` | 6 |
| Active Trip | `Views/Active/` | 6 |
| Completed History | `Views/Completed/` | 6 |
| Ledger Wallet | `Views/Ledger/` | 6 |
| Earnings Stats | `Views/Earnings/` | 6 |
| Profile | `Views/Profile/` | 6 |

**Totals**: 6 root + 42 views + 6 feature overviews + 3 config/style = **57 files** (complete)

## SuperAdmin — Tabs Documented (17)

| View | Subfolder | Files |
|---|---|---|
| Ecosystem Overview | `Views/Dashboard/` | 6 |
| Partner Requests | `Views/Onboarding/` | 6 |
| Financial Recon | `Views/Reconciliation/` | 6 |
| Managed Entities | `Views/Businesses/` | 6 |
| Outlet Profiles | `Views/Outlets/` | 6 |
| Global Analytics | `Views/Analytics/` | 6 |
| Rider Management | `Views/Riders/` | 6 |
| Service Slabs | `Views/Delivery/` | 6 |
| Inventory Control | `Views/Inventory/` | 6 |
| Promotions Center | `Views/Promotions/` | 6 |
| User Registry | `Views/Users/` | 6 |
| Live Orders | `Views/LiveOrders/` | 6 |
| Ratings & Reviews | `Views/Reviews/` | 6 |
| Broadcast Center | `Views/Broadcast/` | 6 |
| Security Audit | `Views/Audit/` | 6 |
| Ecosystem Reports | `Views/Reports/` | 6 |
| Infrastructure | `Views/Settings/` | 6 |

**Totals**: 6 root + 102 views + 8 feature overviews + 2 config + 3 supplementary = **121 files** (complete)

## SupremeAdmin — Tabs Documented (15)

| Tab | Subfolder | Files |
|---|---|---|
| Dashboard KPIs | `Dashboard/` | 6 |
| Partner Onboarding | `Onboarding/` | 6 |
| Managed Entities | `Businesses/` | 6 |
| Live Orders | `Live-Orders/` | 6 |
| Rider Management | `Riders/` | 6 |
| User Registry | `Users/` | 6 |
| Promotions Center | `Promotions/` | 6 |
| Settlements | `Settlements/` | 6 |
| Delivery Slabs | `Delivery-Slabs/` | 6 |
| Inventory Control | `Inventory/` | 6 |
| Ratings & Reviews | `Reviews/` | 6 |
| Broadcast Center | `Broadcast/` | 6 |
| Security Audit | `Audit/` | 6 |
| Ecosystem Reports | `Reports/` | 6 |
| Infrastructure | `Settings/` | 6 |

**Totals**: 6 root + 90 tabs = **96 files** (complete)

## Grand Totals

| App | Files | Status |
|---|---|---|
| Shared | 6 | Complete |
| Admin Dashboard | 122 | Complete |
| Bot | 34 | Complete |
| Marketplace | 91 | Complete |
| Rider App | 57 | Complete |
| SuperAdmin | 121 | Complete |
| SupremeAdmin | 96 | Complete |
| **Total** | **527** | **Complete** |

## Rules

- **Read before code**: Always read relevant `Logic/` files before making code changes (enforced by `.agent/rules/logic-kb.md`)
- **Update after code**: Every code change must include corresponding `Logic/` file updates
