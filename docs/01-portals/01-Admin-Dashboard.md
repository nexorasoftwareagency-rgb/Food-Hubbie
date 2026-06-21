# Admin Dashboard — React 18 SPA

**URL**: `foodhubbie-admin.web.app`  
**Stack**: React 18 + Vite 7 + Tailwind 4 + recharts + lucide  
**Source**: `admin-dashboard/src/` — single-file `App.jsx` (3572 lines)  
**Hosting target**: `admin` → `admin-dashboard/dist`

---

## 1. Code-Logics

### App Structure

```
main.jsx -> App.jsx
  ├── 19 page functions (no router — PAGES object + state machine)
  ├── 13 shared components (GlassCard, BtnPrimary, Modal, Toast, Pill, etc.)
  ├── 11 utility constants (ORANGE, COLORS, ORD_ST, SEQ, LIVE_ST, PIE_COLORS, etc.)
  ├── useRealtimeData.js hook
  ├── utils/constants.js, formatters.js, printing.js (255L), validators.js
  └── firebase.js (228L) — init + App Check + secondary auth + audit log
```

### 19 Sections (functions in App.jsx)

| Section | Lines | Key logic |
|---|---|---|
| `App()` | 3276–3572 | Auth gateway, sidebar, mobile nav, tab routing (PAGES object), ReauthModal, idle timeout (30min soft / 5min hard) |
| `DashboardPage` | 202–329 | KPIs (today revenue, pending, in-progress, active riders), revenue trend chart (AreaChart, today/week toggle), priority orders (6 max), top items (5), top customers (5), recent orders table (8) |
| `OrdersPage` | 334–553 | Search, date filter, All/Live/History tabs, order drawer with status update, rider assignment, delete, CSV export |
| `CategoriesPage` | 554–615 | CRUD for categories: name, image, order, add-ons |
| `MenuPage` | 616–755 | CRUD for dishes: name, price, image, category, sizes, add-ons, availability toggle, stock |
| `POSPage` | 756–1088 | Walk-in/Dine-in ordering: category grid, cart, size/addon selection, discount, payment (Cash/UPI/Card), print receipt |
| `CustomersPage` | 1089–1168 | Customer list from orders, search, order count, lifetime value |
| `LiveTrackerPage` | 1169–1220 | Leaflet map of online riders, 30s polling |
| `SettingsPage` | 1221–1326 | Store info, delivery config, bot images, hours, fee slabs, theme |
| `LiveOpsPage` | 1327–1600 | Real-time active orders Kanban, rider status, bulk status updates |
| `KitchenPage` | 1601–1800 | Kitchen Display: orders grouped by status columns (Pending, Confirmed, Preparing, Cooked) with auto-transition |
| `InventoryPage` | 1801–2150 | **Real Firebase**: live stock from `inventory/` + `dishes/` (boolean & numeric), -1/+5/+10 quick-adjust, full CRUD (create/edit/delete raw materials), per-change audit log (`inventory_create`/`update`/`delete`/`stock_adjust`/`stock_toggle`), CSV export. Dish stock auto-decremented by Marketplace `orderService.submitOrder()`, Admin POS checkout, and bot `handleFinalCheckout` |
| `RidersPage` | 1976–2483 | CRUD: name, phone, email, Aadhar, photo, bank details, status, stats, auth account creation via secondary app |
| `PartnersPage` | 2485–2651 | Partner network (system/partners): type, contact, status |
| `AnalyticsPage` | 2852–3120 | **Real Firebase**: live `orders` + `riders` + `dishes` subscriptions, 5 KPIs (Revenue, Orders, AOV, Best Day, Cancellation Rate), period filter (week=7d / month=30d / quarter=90d, real date window), 6 charts: Revenue & Orders dual-axis bar, vs-Previous-Period, Sales by Category pie, Orders by Hour area, Top Dishes horizontal bar, Top Customers ranked list; CSV export of daily aggregates |
| `LostSalesPage` | 2849–2920 | Cancelled orders log: potential revenue, items abandoned |
| `SettlementsPage` | 2921–2998 | Settlement records: amounts, methods, statuses |
| `NotificationsPage` | 2999–3104 | Send push/SMS to customers, broadcast history |
| `FeedbackPage` | 3105–3175 | Customer reviews: star ratings, comments, response |

### Shared Components (inline in App.jsx)

| Component | Props | Usage |
|---|---|---|
| `GlassCard` | children, className, style | Every card in app (frosted glass) |
| `KPICard` | title, value, sub, icon, color | Dashboard stat cards |
| `StatCard` | label, value, icon, color, bg, sub | All section stat cards |
| `StatusBadge` | status | Color-coded order status pill |
| `BtnPrimary` / `BtnSecondary` | children, onClick, style | All action buttons |
| `Modal` | children, open, onClose, wide | Order drawer, forms, confirmation |
| `Toast` | msg, type, onClose | Success/error/info notifications |
| `Pill` | label, active, onClick | Tab filters |
| `ToggleSwitch` | checked, onChange | Boolean toggles |
| `Avatar` | name, size | User avatars |
| `EmptyState` | icon, msg | Placeholder states |
| `Loading` | — | Loading spinner |
| `Input` / `Select` | ... | Form inputs |
| `SectionHeader` | title, action | Page section headers |

---

## 2. Firebase-Rules

Refer to `docs/03-foundation/03-Database-Security-Rules.md` for full rules. Admin-specific paths:

| Path | Admin-rider assignment |
|---|---|
| `businesses/{$bid}/outlets/{$oid}/orders/{$id}` | read: true; write: admin with matching `outletId` |
| `businesses/{$bid}/outlets/{$oid}/settings` | read: true; write: admin auth |
| `businesses/{$bid}/outlets/{$oid}/dishes` | read: true; write: admin auth |
| `businesses/{$bid}/outlets/{$oid}/inventory` | read: true; write: admin auth |
| `businesses/{$bid}/outlets/{$oid}/meta` | read: true; write: admin auth |
| `riders/{$uid}` | read: admin or self; write: admin |
| `admins/{$uid}` | read: self or super; write: super |
| `system/` | superadmin |

Admin session uses **secondary Firebase app** for rider account CRUD to avoid displacing the admin's own auth session (`firebase.js` lines 169–228).

---

## 3. Database-Structure

All data scoped to `businesses/{bid}/outlets/{oid}/{collection}`. Key differences from Marketplace schema:

- **orders** use `ORD_ST` mapping (9 statuses + colors + backgrounds)
- **riders** store full KYC (Aadhar photos, bank details, age, father name)
- **dishes** support size-based pricing (`sizes` map) and category-level add-ons
- **inventory** tracks stock by name with audit trail. Schema: `{ name, category, stock, threshold, unit, createdAt, updatedAt }`. Dish stock: boolean `true|false` OR numeric count, auto-decremented by 3 order-placement paths (Marketplace, POS, bot)
- **settings/Delivery** stores `feeSlabs` array, `riderAcceptanceRadius`, `backupCode`
- **settings/Bot** stores WhatsApp image URLs per order status
- **logs/audit** records every admin action (actor, action, details, timestamp). Inventory mutations emit `inventory_create` / `inventory_update` / `inventory_delete` / `inventory_stock_toggle` / `inventory_stock_adjust`

---

## 4. Connecting-Nodes

```
[Admin logs in] -> firebase.js getAuthInstance() -> onAuthStateChanged
  -> App.jsx: user/adminData state -> loginForm/BusinessId selector
  -> setOutletContext(businessId, outletId)
  -> All Outlet(path) calls resolve to businesses/{bid}/outlets/{oid}/{path}
  -> PAGES object renders the selected section

[Order status update]:
  OrdersPage.updateStatus(orderId, newStatus)
    -> update(Outlet("orders/{id}"), { status })
    -> logAudit(bizId, outletId, "status_update", ...)
    -> RTDB child_changed -> Bot status-monitor -> WhatsApp to customer

[Low-stock banner]:
  App component root -> onValue(Outlet("inventory")) + onValue(Outlet("dishes"))
    -> count items at-or-below threshold
    -> if count > 0: show yellow banner above <main> with "View Inventory" CTA
    -> banner dismissible via X button (resets when count changes)
```

---

## 5. Complete-Flow: Order Management

1. Admin opens Orders tab → `onValue` on `Outlet("orders")` → real-time list
2. Clicks any order → order drawer (Modal) opens:
   - Customer details, items, billing, delivery info
3. Status dropdown shows only the next valid status (enforced by `SEQ` array + `curLvl+1`)
4. Admin confirms → `update(Outlet("orders/{id}"), { status })`
5. Rider assignment: dropdown of all riders → `update()` sets `riderId`, `assignedRider`, `riderName`, `riderPhone`
6. Audit log written to `logs/audit`
7. WhatsApp notification sent to customer via bot's status-monitor

**Idle Timeout**: 30 min soft lock → 5 min hard lock. ReauthModal requires re-credential for sensitive actions (delete rider, delete catalog items).

## Complete-Flow: Inventory Management

1. Admin opens Inventory tab → two `onValue` listeners fire (`inventory/` + `dishes/`) → live table rendered
2. Quick adjust: clicks **-1** / **+5** / **+10** → `updateStock()` clamps to `Math.max(0, ...)`, writes to RTDB, `logAudit("inventory_stock_adjust", {previous, next, delta})`
3. Toggle dish availability: clicks **Mark Available/Unavailable** → `updateStock()` flips boolean, `logAudit("inventory_stock_toggle", ...)`
4. Add new raw material: clicks **+ New Item** → modal → `push(Outlet("inventory"))` + `set()` → `logAudit("inventory_create", {full payload})`
5. Edit raw material: clicks ✏️ icon → modal pre-filled → `update(Outlet(`inventory/${id}`), ...)` → `logAudit("inventory_update", {previous, next diff})`
6. Delete raw material: clicks 🗑️ icon → `confirm()` → `remove(Outlet(`inventory/${id}`))` → `logAudit("inventory_delete", {snapshot})`
7. Low-stock banner (root App): separate `onValue` listener counts items at-or-below threshold across both `inventory/` and `dishes/`. If > 0, shows dismissible yellow banner with "View Inventory" CTA
8. CSV export: clicks **Export CSV** → builds rows with `row, item, stock, threshold, unit, status` → `downloadCSV(filename, rows)`
