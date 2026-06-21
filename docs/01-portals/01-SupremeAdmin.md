# SupremeAdmin — Top-Level System Administration

**URL**: `foodhubbie-supremeadmin.web.app`  
**Stack**: Vanilla JS + Firebase compat SDK v11.4.0 (Auth, RTDB, **Firestore**, **Functions**) + Chart.js v4.4.7 + lucide  
**Source**: `SupremeAdmin/index.html` (680 lines), `SupremeAdmin/app.js` (2250 lines)  
**Hosting target**: `supreme` → `SupremeAdmin/`

---

## 1. Code-Logics

### App Structure

```
index.html (680L):
  - Auth gateway + sidebar with 15 nav links + content containers
  - Firebase v11.4.0 compat SDK: app, auth, database, firestore, functions
  - lucide v0.468.0, Chart.js v4.4.7

app.js (2250L):
  - Classic Firebase compat pattern (firebase.initializeApp, firebase.auth(), firebase.database())
  - 15 tab functions (showTab state machine, data-tab routing)
  - Global in-memory caches: allBusinesses, allRiders, allUsers, allOrders, allReviews
  - API_KEY constant for Firebase Auth REST API (create/delete users)
  - PAGE_SIZE = 15, RIDER_PAGE_SIZE = 20, USER_PAGE_SIZE = 20, AUDIT_PAGE_SIZE = 50
```

### 15 Tabs

| Tab ID | Label | Status | Features |
|---|---|---|---|
| `dashboard` | Dashboard | Working | KPIs (orders/revenue/riders/users), revenue Charts.js (bar + doughnut), recent activity |
| `onboarding` | Partner Onboarding | Working | Approve/reject requests, provision modals |
| `businesses` | Businesses | Working | Searchable list, edit outlet, commission configuration |
| `liveorders` | Live Orders | Broken init + view toggle | Table + Kanban tabs, never bootstraps correctly |
| `riders` | Riders | Working | CRUD table, secondary auth account creation via REST API, CSV export |
| `users` | Users | Partially broken | Wallet credit/history (broken), user list, CSV export |
| `promotions` | Promotions | Partially broken | Surge pricing (works), discount/fee config (broken), coupons |
| `settlements` | Settlements | Working | Per-order settlement, audit log, CSV export |
| `delivery` | Delivery Slabs | Working | prompt()-based editing, array storage in system/settings |
| `inventory` | Inventory | Working | Stock transaction logging, availability toggle |
| `reviews` | Reviews | Working | Read-only star ratings, truncated comments |
| `broadcast` | Broadcast | Working | Rate-limited push (1 send/10s), audience targeting by business/outlet |
| `audit` | Audit | Working | 4-path aggregation (marketplaceAudit + botAudit + admin audit + system auditLogs), paginated |
| `reports` | Reports | Working | Metrics (30d revenue, orders, refunds), top 10 outlets, CSV/PDF export |
| `settings` | Settings | Stub | TFA (placeholder), data retention archive/purge |

### Key Architecture Decisions
- **Dual Firebase compat** — v11.4.0 enables both RTDB (all data) and Firestore + Functions (admin operations)
- **Rider Auth via REST API** — Uses `https://identitytoolkit.googleapis.com/v1/accounts:signUp` with API_KEY to create auth accounts without displacing admin session
- **No 2FA** — Unlike SuperAdmin, SupremeAdmin has only password-based auth (TFA tab is a stub)
- **Known bugs**: Live Orders never initializes (tab show fails), User wallet credit writes to wrong RTDB path, Discount/Fee promotions tab is non-functional

---

## 2. Firebase-Rules

Identical to SuperAdmin's access patterns for RTDB. Additionally:
- **Firestore**: Admin could read/write `system/{collection}` (used via compat SDK)
- **Functions**: `firebase.functions()` available for callable functions (not used in current code)

---

## 3. Database-Structure

Same RTDB structure as SuperAdmin (see `00-DATA-MODEL.md`).

---

## 4. Connecting-Nodes

```
[SupremeAdmin opens app]
  -> index.html auth gateway -> Firebase Auth signIn
  -> Check admins/{uid}/isSupreme flag (not just isSuper)
  -> sidebar rendered with 15 tabs
  -> Tab click -> showTab(tabId) -> hides all, shows selected + loads data

[Data loading pattern]:
  showTab(tabId):
    -> setAllBusinesses? load from Firebase (cached)
    -> setAllRiders? load from Firebase
    -> renderTable(businessesList) with pagination
    -> attach event listeners (edit, delete, export)

[Rider creation]:
  -> admin fills modal form (name, phone, password)
  -> Secondary approach (unlike SuperAdmin's secondary Firebase app):
     POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={API_KEY}
     -> returns uid -> write to riders/{uid}
  -> This avoids Firebase Admin SDK dependency
```

---

## 5. Complete-Flow: Ecosystem Reports

1. SupremeAdmin opens Reports tab
2. Data loaded from `orders/` global index + `businesses/` for outlet names
3. Metrics computed in-memory: 30-day revenue sum, order count, refund count, rider count
4. Top 10 outlets ranked by revenue (sort + slice)
5. Chart.js renders revenue trend line (`type: 'line'`) with outlet breakdown
6. CSV export: builds rows from top 10 outlets + global metrics, triggers download
7. PDF export: builds HTML table → `window.print()` (browser's native save-to-PDF)
