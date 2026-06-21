# SuperAdmin — Enterprise Control Center

**URL**: `foodhubbie-superadmin.web.app`  
**Stack**: Vanilla JS + Firebase compat SDK v9.6.1 (Auth, RTDB, Storage) + Chart.js + SweetAlert2 + otpauth + QRCode.js + html2pdf  
**Source**: `SuperAdmin/index.html` (1766 lines), `SuperAdmin/js/main.js` (4038 lines)  
**Hosting target**: `superadmin` → `SuperAdmin/`

---

## 1. Code-Logics

### App Structure

```
index.html (1766L):
  - Auth Gateway (loginOverlay) + 2FA modal (tfaModal)
  - Master layout: sidebar (17 nav links) + content area (17 section containers)
  - Library CDN imports (lucide, Firebase compat, otpauth, qrcodejs, Chart.js, SweetAlert2)
  - Inline CSS (674 lines, green theme with System font)

js/main.js (4038L):
  - Firebase init (compat: firebase.database(), firebase.auth(), firebase.storage())
  - Secondary Firebase app for account management (avoids admin session displacement)
  - 17 tab functions (show/hide via data-tab attribute, LBTR class)
  - 85+ helper functions (pagination, rendering, CRUD, auth, export)
  - Global state: allBusinesses, allRiders, allAdmins, allUsers, allOrders, etc.
```

### 17 Tabs (Navigation)

| Tab ID | Label | Content |
|---|---|---|
| `dashboard` | Ecosystem Overview | KPIs (total biz/outlets/riders/users/orders/revenue), heatmap, sparklines |
| `onboarding` | Partner Requests | Approve/reject requests, provision business+outlet+admin |
| `reconciliation` | Financial Recon | Settlement processing, manual payouts, order-by-order reconciliation |
| `businesses` | Managed Entities | Business CRUD, commission config, outlet management |
| `outlets` | Outlet Profiles | Per-outlet analytics, menu overview, settings |
| `analytics` | Global Analytics | Growth metrics, revenue charts, rider/order trends |
| `riders` | Rider Management | Fleet CRUD (secondary auth account creation), KYC, stats |
| `delivery` | Service Slabs | Delivery fee tier configuration, distance slabs |
| `inventory` | Inventory Control | Cross-outlet stock monitoring |
| `promotions` | Promotions Center | Surge pricing, global discounts, coupon CRUD |
| `users` | User Registry | Customer profiles, wallet credits, transaction history |
| `liveorders` | Live Orders | Pipeline table + Kanban, SLA monitoring, drag-drop |
| `reviews` | Ratings & Reviews | Scoreboard, reviewed vs pending, filter |
| `broadcast` | Broadcast Center | Notification composer, audience targeting, rate-limited send |
| `audit` | Security Audit | Unified audit logs (4 sources: admin, bot, marketplace, system) |
| `reports` | Ecosystem Reports | KPIs, top 10 outlets, CSV/PDF export |
| `settings` | Infrastructure | 2FA setup, telemetry config, data retention policies |

### Key Features

- **5-Role RBAC**: SuperAdmin, Admin, Rider, Customer, Supreme (via `isSuper`/`isSupreme` flags)
- **TOTP 2FA**: Setup via otpauth library, QR code generation (QRCode.js), 6-digit verification
- **Secondary Auth App**: Creates/deletes rider auth accounts without displacing admin session
- **Data Retention**: 3 policy types (archive at 90d, purge at 180d, keep indefinitely)
- **Onboarding Pipeline**: Request → Review → Provision (auto-create business + outlet + admin)
- **Live Orders Engine**: Table + Kanban view, SLA calculation, drag-drop status update
- **Unified Audit Logs**: Aggregates from `logs/marketplaceAudit`, `logs/botAudit`, `logs/audit`, `system/auditLogs`
- **Client-side Pagination**: SmartLoadMore (15–50 rows per page) with batch reading

---

## 2. Firebase-Rules

| Path | Access |
|---|---|
| `superAdmin` | superadmin only (CRIT-4 fixed) |
| `admins/{uid}/isSuper` | superadmin only |
| `admins` read | superadmin only |
| `onboarding_requests` | admin read, any auth write (first write), admin update |
| `system/*` | superadmin only |
| `businesses` write | superadmin only |
| `businesses/{$bid}` write | superadmin or matching admin businessId |
| `outlets/{$oid}` write | superadmin or matching admin outletId |
| `riders/{$uid}/kycStatus` | superadmin only |
| `riders/{$uid}/verified` | superadmin only |

---

## 3. Database-Structure

**SuperAdmin-specific nodes:**
```
superAdmin/              -- System-wide config (restricted)
onboarding_requests/{uid}
  businessName, ownerName, email, phone, address
  gstin, fssai, outletName, cuisine, coordinates
  status: "pending" | "approved" | "rejected"
system/
  settings/delivery       -- { mode, per100mRate, slabs[] }
  promotions/coupons      -- { code, discount, type, maxUses, usedCount, minOrder, expiresAt }
  promotions/surge        -- { multiplier, active, zones[] }
  promotions/globalDiscount -- { type, value, active }
  config/platformFee      -- { percent, fixed }
  broadcasts/{pushId}     -- { title, body, audience, sentAt }
  admins/{uid}/tfaSecret  -- { secret, verified, createdAt }
  auditLogs/{pushId}      -- Unified audit entries
  settlements/{pushId}    -- Settlement records
```

---

## 4. Connecting-Nodes

```
[SuperAdmin opens app]
  -> index.html auth gateway -> login form -> Firebase Auth signIn
  -> Check admin doc: admins/{uid}.isSuper === true (else reject)
  -> 2FA modal: otpauth.URI -> QRCode.js render -> 6-digit TOTP verify
  -> mainContainer unhidden -> sidebar rendered with 17 tabs

[Onboarding flow]:
  Request comes in -> Onboarding tab -> Review button -> Approve/Reject
    -> If approved: auto-create business in businesses/{bid}
      -> auto-create outlet in businesses/{bid}/outlets/{oid}
      -> auto-create admin auth account (secondary Firebase app)
      -> write admin record to admins/{uid}
      -> update onboarding_request status to "approved"
    -> WhatsApp notification to partner
```

---

## 5. Complete-Flow: Partner Onboarding

1. Partner submits request → `onboarding_requests/{uid}` with all business details
2. SuperAdmin sees request in Onboarding tab (badge count on nav)
3. Clicks Review → modal with full details: business info, GSTIN, FSSAI, coordinates
4. Clicks Approve:
   - Secondary auth app creates Firebase Auth account for new admin
   - `businesses/{bid}` node created with commission config
   - `businesses/{bid}/outlets/{oid}` created with settings, empty menu, empty orders
   - Admin record written to `admins/{uid}` (dual: `admins/` + `system/admins/`)
   - `onboarding_requests/{uid}/status = "approved"`
5. Partner receives WhatsApp notification with login credentials
6. Partner logs into Admin Dashboard, sets up menu, hours, delivery config
