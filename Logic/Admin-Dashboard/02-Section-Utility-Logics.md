# Admin Dashboard — Section / Utility Logics

## 1. DashboardPage (App.jsx:268-395)

**Props:** `{ showToast, outletInfo }`

**State:** `orders:[]`, `riderCount:0`, `tab:"today"|"week"`

**Effects:**
- `onValue(Outlet("orders"))` — Real-time order listener, sets `orders` array
- `onValue(ref(db, "riders"))` — Counts riders with status "Online" or "On Delivery"

**Computed values:**
- `todayRev` — Sum of `total` for delivered orders where `createdAt` is today (IST)
- `pending` — Count of orders with status "Placed" or "Confirmed" or "Preparing"
- `liveOrd` — Orders with status in `LIVE_ST`
- `topItems` — Top 5 dish names by cumulative quantity sold across all orders
- `topCusts` — Top 5 customers by total spend, sorted descending

**Renders:**
- 4 StatCards: Today's Revenue, Pending Orders, In Progress, Active Riders
- Revenue Trend chart (AreaChart with toggle Today/Week)
- Priority Orders card — live orders sorted by urgency
- Top Items list with quantities
- Top Customers list with spend
- Recent Orders table (last 8)

## 2. OrdersPage (App.jsx:400-614)

**Props:** `{ showToast, outletInfo }`

**State:** `search`, `orderTab:"all"|"live"|"history"`, `orders:[]`, `selOrder` (modal), `riders:[]`, `fromDate`, `toDate`

**Effects:**
- `onValue(Outlet("orders"))` — Real-time order listener
- `onValue(ref(db, "riders"))` — Real-time rider list

**Handlers:**
- `updateStatus(id, status)` — Validates SEQ flow, enforces rider before dispatch, prevents cancel-delivered, writes `{ status, paymentStatus }`
- `assignRider(orderId, riderId)` — Fetches rider from `riders/{riderId}`, writes assignment data to order
- `deleteOrder(id)` — `remove(Outlet("orders/{id}"))`
- `exportOrders()` — `downloadCSV("orders.csv", ...)` with filtered orders

**Renders:**
- Toolbar: search, date range pickers, All/Live/History tabs, Export CSV
- Order table: #, Order ID, Customer, Phone, Items, Total, Payment, Status dropdown, Rider dropdown, Created, Actions (view/delete)
- Order detail modal: customer info, delivery address with Google Maps link, items list, pricing breakdown, status dropdown, rider assignment

## 3. CategoriesPage (App.jsx:619-672)

**Props:** `{ showToast }`

**State:** `cats:[]`, `showForm`, `name`, `order`, `img`

**Effect:** `onValue(Outlet("categories"))`

**Handlers:**
- `handleSave()` — `push(Outlet("categories"), { name, image, order, addons: null })`
- `handleDelete(id)` — `remove(Outlet("categories/{id}"))`

**Renders:** Category list with image/name/order/addon-count/delete, modal form for new category

## 4. MenuPage (App.jsx:677-808)

**Props:** `{ showToast }`

**State:** `dishes:[]`, `cats:[]`, `showForm`, `editId`, `f` (form fields object), `sizeList:[{name,price}]`, `search`

**Effects:**
- `onValue(Outlet("dishes"))` + `onValue(Outlet("categories"))`
- Auto-migration: detects `typeof stock === "boolean"` → writes `{ stock:0, threshold:5 }` to Firebase

**Handlers:**
- `openForm(d)` — Populates form from existing dish or defaults
- `handleSave()` — Validates name/price, builds sizes object + addons JSON parse, `push` or `update` dish
- `handleDelete(id)` — `remove(Outlet("dishes/{id}"))`

**Renders:**
- Search + Add Dish button
- Dish grid: image, stock badge (green/red/orange), category tag, name, sizes with prices, edit/delete
- Modal: name, category select, base price, image URL, display order, stock, threshold, dynamic sizes, addons JSON

## 5. POSPage (App.jsx:813-1110)

**Props:** `{ showToast, outletInfo }`

**State:** dishes, cats, catFilter, search, cart (object), custName, custPhone, discount, payMethod, orderType, orderNotes, selModal, selSize, selAddons, selQty, editKey, loading

**Effects:**
- `onValue(Outlet("dishes"))` + `onValue(Outlet("categories"))` — Filters stock > 0
- Keyboard listener (Escape/Enter) when selModal open

**Handlers:**
- `openSelection(dish)` — Opens modal for size/addon/qty selection
- `openEditCartItem(key, item)` — Opens modal pre-filled for editing
- `addToCart()` — Adds/updates cart item with size/addons/qty
- `updateCartQty(key, delta)` — Adjusts qty, removes if <= 0
- `removeFromCart(key)` — Deletes from cart
- `clearCart()` — Resets cart + form fields
- `handleCheckout()` — Validates phone, checks stock, writes order + decrements stock, prints receipt, clears cart

**Renders:**
- Left: category pills, search, dish grid with stock warnings
- Right (360px cart sidebar): phone/name inputs, order type radios, notes, cart items (editable), totals (subtotal/discount/tax/grand total), payment method selector, Record Sale + Clear buttons
- Selection modal: size grid, addons list, qty selector, Add to Cart

## 6. CustomersPage (App.jsx:1115-1190)

**Props:** `{ showToast }`

**State:** `customers:[]`, `orders:[]`, `search`

**Effects:**
- `onValue(Outlet("customers"))` + `onValue(Outlet("orders"))`

**Computed:** Merges customer data with order history → `orderCount` and `ltv` (lifetime value), sorted by LTV descending

**Renders:** Search + Export CSV, customer table (name+joined, phone+WhatsApp link, orders count, LTV)

## 7. LiveTrackerPage (App.jsx:1195-1242)

**Props:** `{ showToast }`

**State:** `online` (rider count)

**Effect:** Dynamic import of Leaflet, map init, rider listener with marker management

**Renders:** "X Riders Online" heading + full-height Leaflet map

## 8. SettingsPage (App.jsx:1247-1348)

**Props:** `{ showToast }`

**State:** `tab:"store"|"delivery"|"display"`, `s` (store settings), `d` (delivery settings)

**Effects:**
- `onValue(Outlet("settings/Store"))` + `onValue(Outlet("settings/Delivery"))`

**Handlers:**
- `handleSaveStore()` — Validates coords/GSTIN/FSSAI, writes to `Outlet("settings/Store")`
- `handleSaveDelivery()` — Writes to `Outlet("settings/Delivery")` with slabs array
- `addSlab()/updateSlab()/removeSlab()` — Manage delivery fee slabs

**Renders:** Tab bar, store form (2-col grid), delivery form with slab rows, display placeholder

## 9. LiveOpsPage (App.jsx:1353-1610)

**Props:** `{ showToast }`

**State:** `orders:[]`, `riders:[]`, `search`, `statusFilter`, `editing` (modal), `advancing` (Set)

**Effects:**
- `onValue(Outlet("orders"))` + `onValue(ref(db, "riders"))`

**Handlers:**
- `advance(id)` — Next status in SEQ (requires rider before dispatch)
- `cancel(id)` — Cancel order (not if delivered)
- `saveOperation()` — Create/update manual operation
- `deleteOperation(id)` — Remove order
- `assignRider(orderId, riderId)` — Assign rider to order
- `exportOperations()` — CSV export

**Renders:** KPIs (Live Orders, Pending Accept, In Kitchen, Out for Delivery), full ops table with progress bars/status dots/timer/actions, Live Order Feed card, Rider Activity card, edit modal

## 10. KitchenPage (App.jsx:1615-1810)

**Props:** `{ showToast }`

**State:** `kitchenOrders`, `statusTimers`, `selected` (modal), `filter`, `search`

**Effect:** `onValue(Outlet("orders"))` filtered to KITCHEN_ST statuses; 60s interval for timers

**Flow:** Placed → Confirmed → Preparing → Cooked → Ready

**Handlers:**
- `advance(id)` — Advance single order
- `advanceAll()` — Advance all eligible at once
- `cancelOrder(id)` — Cancel order

**Renders:** Filter pills with counts, card grid (colored top bar, timer, HOLD badge at >=10min), detail modal

## 11. InventoryPage (App.jsx:1815-1897)

**State:** `items` from MOCK_INVENTORY with computed status

**Handlers:**
- `updateStock(id, delta)` — Adjusts stock, recomputes status
- `exportInventory()` — CSV export

**Renders:** KPIs (Total/Low/Out), table with stock bar/threshold/status/+1/+5/+10 buttons

## 12. RidersPage (App.jsx:1902-2112)

**State:** `riders:[]`, `selected`, `filter`, `search`, `view:"table"|"grid"`

**Handlers:**
- `toggleStatus(id)` — Toggle online/offline
- `exportCSV()` — CSV export

**Renders:** KPIs (Online/On Delivery/Completion Rate/Avg Rating), table/grid views, detail modal with earnings chart

## 13. PartnersPage (App.jsx:2117-2196)

**State:** `partners` from MOCK_PARTNERS

**Handlers:**
- `update(id, status)` — Approve or reject partner

**Renders:** Table with avatar/name/type/since/contact/status + Approve/Reject

## 14. AnalyticsPage (App.jsx:2201-2347)

**State:** `period:"week"|"month"|"quarter"`

**Computed:** totalRev, totalOrd, prevRev, prevOrd, revTrend, ordTrend, avgValue, avgTrend, bestDay

**Renders:** KPIs with trends, Revenue vs Orders bar chart, vs Last Week comparison, Category pie chart, Hourly area chart, Rider performance bars

## 15. LostSalesPage (App.jsx:2352-2392)

**State:** None (pure mock data from MOCK_LOST)

**Computed:** totalLoss, cancelled count, avg loss/order

**Renders:** 3 KPIs + table (order ID, customer, reason, time, loss)

## 16. SettlementsPage (App.jsx:2397-2449)

**State:** None (pure mock data from MOCK_TRANSACTIONS)

**Computed:** total, credits, debits

**Renders:** KPIs + Export buttons (CSV/PDF) + transaction table

## 17. NotificationsPage (App.jsx:2454-2521)

**State:** `form` (title/body/audience), `sent:[]` (history)

**Handlers:**
- `sendNotif()` — Adds fake notification to sent history

**Renders:** Compose form + sent history cards

## 18. FeedbackPage (App.jsx:2526-2572)

**State:** None (pure mock data)

**Renders:** Rating summary (4.7 avg, 5-star distribution bars), feedback cards with avatar/name/time/rating/comment/dish

## Utility Files (Modular)

### `utils/constants.js`
- `ORANGE`, `COLORS`, `PIE_COLORS`
- `ORDER_STATUSES` — 7 statuses with label/color/bg
- `statusColors` — Inventory stock status colors
- `stockStatus(stock, thr)` — Returns "critical"|"low"|"ok"
- `STATUS_FLOW` — 6-step order flow
- `SETTINGS_PATHS` — Firebase paths for settings

### `utils/formatters.js`
- `fmt(v)` — ₹XX,XXX format
- `cn(...c)` — Class name joiner
- `escapeHtml(str)` — HTML escape
- `haptic()` — Vibration trigger

### `utils/validators.js`
- `validateCoords(lat, lng)` — Returns `{valid, msg}`
- `validatePhone(phone, label)` — 10 or 12 digit (with 91)
- `validateGSTIN(gst)` — GSTIN regex
- `validateFSSAI(fssai)` — 14-digit check
- `validateBackupCode(code)` — 4-digit check

### `hooks/useRealtimeData.js`
- `useRealtimeData(path)` — Returns `{data, loading, error}`, subscribes to `Outlet(path)`
- `useRealtimeObject(path)` — Returns raw snapshot value
- `firebaseGet(path)` — One-time read from `Outlet(path)`

### `components/` (13 files)
Avatar, BtnPrimary, EmptyState, GlassCard, KPICard, Modal, Pill, SearchInput, SectionHeader, StarRating, StatusBadge, Toast, ToggleSwitch
