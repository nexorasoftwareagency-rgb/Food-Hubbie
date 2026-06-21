# Admin Dashboard — Complete Flows

## Flow 1: Full Authentication & Initialization

```
1. User opens admin-dashboard (foodhubbie-admin.web.app)
   │
2. main.jsx renders <App /> in #root
   │
3. App mounts → onAuthStateChanged(auth, callback)
   │
4. [Loading state] — Shows FoodHubbie logo + spinner animation
   │
5a. [No user] — Renders login screen:
      ├── Full-screen orange gradient background (bg: #E84908 → #D94400)
      ├── GlassCard with logo + "Welcome back" text
      ├── Email input + Password input
      ├── "Sign In" button → handleLogin()
      │     └── signInWithEmailAndPassword(auth, email, password)
      │     └── On error: show error message (invalid credentials, etc.)
      └── No registration flow (accounts pre-created)

5b. [User authenticated] — Renders dashboard layout:
      ├── Read admins/{user.uid}:
      │     ├── businessId → set _bizId global
      │     ├── outletId → set _outletId global
      │     ├── outletName, outletAddress → set outletInfo state
      │     └── setOutletContext(bizId, outletId)
      │
      ├── Sidebar renders:
      │     ├── Logo + brand
      │     ├── Outlet info card
      │     ├── NAV_GROUPS navigation
      │     ├── Dark mode toggle
      │     └── Logout button
      │
      ├── Header renders:
      │     ├── Mobile hamburger toggle
      │     ├── Page title (from PAGE_TITLES)
      │     ├── Outlet name display
      │     ├── Notification bell icon
      │     └── User avatar
      │
      ├── Main content:
      │     └── PAGES[page] rendered with props { showToast, outletInfo }
      │
      ├── Mobile bottom nav (5 items)
      └── Toast container (bottom-center, hidden until showToast called)
```

## Flow 2: POS Order — Complete Sale Cycle

```
1. User navigates to POS (PAGES["pos"] = POSPage)
   │
2. useEffect fires:
   ├── onValue(Outlet("dishes")) → dishes state (filtered: stock > 0)
   └── onValue(Outlet("categories")) → cats state
   │
3. Page renders:
   ├── Left panel:
   │     ├── Category filter pills
   │     ├── Search input
   │     └── Dish grid (image + name + price + stock badge)
   │
   └── Right panel (360px cart sidebar):
         ├── Customer phone input
         ├── Customer name input
         ├── Order type radio (Dine-in / Takeaway)
         ├── Notes textarea
         ├── Cart items (empty initially)
         ├── Subtotal / Discount / Tax / Total
         ├── Payment method selector (Cash / UPI / Card)
         ├── "Record Sale" button
         └── "Clear All" button
   │
 4. User clicks a dish card → openSelection(dish):
    ├── If dish has sizes → show size grid (defaults to first size or "Standard")
    ├── If dish has addons → show addons list (from dish's category)
    ├── Qty selector (+/-)
    └── "Add to Cart" button → addToCart():
          ├── Build price: base = sizes[selSize] ?? dish.price ?? 0, addonTotal = sum(selAddons values)
          ├── Build composite key: `${dishId}::${sizeName}::${sortedAddonKeys}`
          ├── If editKey set: delete old cart entry first
          ├── Add new entry or merge qty with existing
          └── Close modal, clear editKey
    │
 5. User edits cart:
    ├── Click cart row → openEditCartItem(key, item)
    ├── Finds dish from dishes[] state
    ├── If dish not found → toast "Original dish no longer available"
    ├── Pre-fills modal with existing size/addons/qty
    └── On save: remove old + add new entry
    │
 6. User clicks "Record Sale" → handleCheckout():
    ├── Validate cart not empty → toast error
    ├── Validate phone (if filled): strip non-digits, check 10 digits
    ├── Validate _outletId exists → toast error if not
    ├── Show loading state
    │
    ├── Fetch ALL dishes fresh via get(Outlet("dishes")) (single read, not per-item):
    │     └── For each cart item:
    │           ├── If dish missing from fresh data → throw error "{name} no longer available"
    │           └── If qty > freshDish.stock → throw error "{name}: only {stock} in stock, ordered {qty}"
    │
    ├── Generate orderId:
    │     ├── Read orderSequence from Outlet("metadata/orderSequence") (outlet root)
    │     ├── seqNum = (seq.val() || 0) + 1
    │     ├── dateStr = YYYYMMDD (e.g., "20260525")
    │     └── orderId = `${dateStr}-${seqNum.toString().padStart(4,"0")}` (e.g., "20260525-0001")
    │
    ├── Compute pricing:
    │     ├── subtotal = sum(item.price * item.qty)
    │     ├── discVal = subtotal * (discount / 100)
    │     ├── taxVal = (subtotal - discVal) * 0.05
    │     └── total = subtotal - discVal + taxVal
    │
    ├── Build orderData:
    │     ├── orderId, customerName||"Walk-in", phone||"Walk-in"
    │     ├── cart: Object.values(cart) (array of items with name/qty/price/size/addons)
    │     ├── subtotal, discount: discVal, tax: taxVal, total
    │     ├── status: "Confirmed" (NOT "Placed" — bypasses for counter sales)
    │     ├── type: orderType, paymentMethod, notes
    │     ├── outletAddress: outletInfo?.address || ""
    │     ├── outlet: _outletId
    │     └── createdAt: new Date().toISOString()
    │     NOTE: No serverTimestamp — uses JS Date string
    │
    ├── Firebase writes:
    │     ├── set(Outlet("orders/{orderId}"), orderData) — write order
    │     ├── update(Outlet("metadata/orderSequence"), seqNum) — increment seq
    │     └── For each cart item:
    │           └── update(Outlet("dishes/{item.id}"), { stock: max(0, fresh - qty) })
    │
    ├── Print receipt:
    │     └── window.open("data:text/html,<html><body onload=window.print()>...", "_blank"):
    │           ├── Customer name, order ID, order type (Dine-in/Takeaway)
    │           ├── Outlet address (if available)
    │           ├── Items table: qty × name (size) + line total
    │           ├── Tax (5%) line
    │           ├── Total line
    │           └── NO discount line, NO payment method, NO thank you message
    │         → Browser print dialog opens automatically (onload)
    │         → User closes tab after print (no auto-close)
    │
    ├── clearCart() — resets: cart {}, discount 0, custName "", custPhone "", orderNotes "", orderType "Dine-in"
    │     NOTE: payMethod is NOT reset (stays as last selection); discount IS reset to 0
    │
    ├── toast "Sale #20260525-0001 completed!"
    └── Loading state removed
```

## Flow 3: Order Management — Lifecycle

```
1. Order created via POS → status: "Confirmed" (bypasses "Placed"); manual entry via LiveOps → status: "Placed"
   │
2. OrdersPage / LiveOpsPage detects via onValue listener
   │
3. Admin views order in OrdersPage:
   ├── Filter by All / Live / History
   ├── Search by customer/phone/ID
   ├── Filter by date range
   └── Click row → detail modal:
         ├── Customer: name, phone, address
         ├── Items: list with sizes/addons
         ├── Pricing: subtotal, discount, tax, total
         ├── Status: dropdown to update
         └── Rider: dropdown to assign
   │
4. Status advancement (strict sequential via SEQ array):
   ├── Placed → Confirmed (accept)
   ├── Confirmed → Preparing (start prep)
   ├── Preparing → Cooked (finish cooking)
   ├── Cooked → Ready (ready for pickup)
   ├── Ready → Out for Delivery (requires rider assigned)
   ├── Out for Delivery → Reached Drop Location
   ├── Reached Drop Location → Delivered
   └── Any status → Cancelled (except Delivered)
   │
5. Rider assignment:
   ├── Fetch riders list from ref(db, "riders")
   ├── Select rider from dropdown
   ├── Fetch rider profile: name, phone
   └── Write to order: riderId, riderName, riderPhone, assignedAt
   │
6. KitchenPage filtered view:
   ├── Only shows orders in Placed/Confirmed/Preparing/Cooked/Ready
   ├── advanceAll() — batch advance all eligible
   ├── Timer shows time in current status (HOLD badge @ >=10min)
   └── Cancel button available
```

## Flow 4: Menu Management

```
1. Navigate to MenuPage
   │
2. useEffect:
   ├── onValue(Outlet("dishes")) → dishes array
   ├── onValue(Outlet("categories")) → cats array
   └── Auto-migration check:
         └── For each dish: if dish.stock === boolean
               └── update(Outlet("dishes/{id}"), { stock: 0, threshold: 5 })
   │
3. View dishes:
   ├── Grid cards with: image, stock badge, category tag, name, sizes+prices
   ├── Stock badge:
   │     ├── stock === 0 → red "Out of Stock"
   │     ├── stock <= threshold → orange "Low Stock"
   │     └── stock > threshold → green "(N)" stock count
   ├── Search filter
   ├── Category filter via tab/pill
   └── Edit (pencil) / Delete (trash) icons on each card
   │
4. Add / Edit dish:
   ├── Click "Add Dish" button or edit icon
   ├── Modal form fields:
   │     ├── Dish name (required)
   │     ├── Category (dropdown from cats)
   │     ├── Base price (required)
   │     ├── Image URL
   │     ├── Display order (number)
   │     ├── Stock quantity (number)
   │     ├── Threshold (number)
   │     ├── Dynamic sizes list: name + price, Add/Remove buttons
   │     └── Addons JSON textarea
   │
   ├── handleSave():
   │     ├── Validate name and price
   │     ├── Build sizes object from sizeList array
   │     ├── Parse addons JSON (or null if empty)
   │     ├── If editId: update(Outlet("dishes/{editId}"), data)
   │     └── Else: push(Outlet("dishes"), data)
   │
   └── handleDelete(id):
         ├── Confirm via toast/action
         └── remove(Outlet("dishes/{id}"))
```

## Flow 5: Settings Configuration

```
1. Navigate to SettingsPage
   │
2. useEffect:
   ├── onValue(Outlet("settings/Store")) → s state
   └── onValue(Outlet("settings/Delivery")) → d state
   │
3. Store tab:
   ├── 2-column grid of inputs:
   │     ├── Entity Name, Store Name, Address
   │     ├── GSTIN, FSSAI, Tagline, Powered By
   │     ├── WiFi Name, WiFi Password
   │     ├── Instagram, Facebook, Review URL
   │     ├── Latitude, Longitude
   │     └── Open Time, Close Time (time inputs)
   │
   ├── "Save Store" → handleSaveStore():
   │     ├── validateCoords(lat, lng)
   │     ├── validateGSTIN(gstin) — toast error if invalid
   │     ├── validateFSSAI(fssai) — toast error if invalid
   │     └── update(Outlet("settings/Store"), { ...fields, updatedAt })
   │
4. Delivery tab:
   ├── Phone inputs: Developer Phone, Report Phone, Notify Phone
   ├── Backup Code
   ├── Dynamic fee slab rows:
   │     ├── Each row: km (number) + fee (number) + delete button
   │     ├── "Add Slab" button → push to slabs array
   │     └── Inline edit for km/fee
   └── "Save Delivery" → update(Outlet("settings/Delivery"), data)

5. Display tab:
   └── Placeholder (future visibility checkboxes)
```

## Flow 6: Customer Analytics Aggregation

```
1. Navigate to CustomersPage
   │
2. useEffect:
   ├── onValue(Outlet("customers")) → customer profiles
   └── onValue(Outlet("orders")) → all orders
   │
3. Computed aggregation:
   └── For each customer (keyed by phone):
         ├── Filter: orders where order.phone === phone
         ├── orderCount = filtered.length
         ├── ltv = sum(filtered.map(o => o.total))
         └── joinedDate = customer.registeredAt
   │
4. Sort customers by LTV descending
   │
5. Render table:
   ├── Customer: name + joined date
   ├── Contact: phone + WhatsApp link
   ├── Orders: count
   └── LTV: total spend
   │
6. Export: downloadCSV("customers.csv", data)
```

## Flow 7: Live Tracker — Rider Map

```
1. Navigate to LiveTrackerPage
   │
2. useEffect:
   ├── Dynamic import("leaflet"):
   │     └── If successful:
   │           ├── Initialize map centered on outlet coords
   │           ├── Add tile layer (OpenStreetMap)
   │           │
   │           └── onValue(ref(db, "riders")):
   │                 ├── Clear existing markers
   │                 ├── For each rider with location:
   │                 │     ├── Add marker with rider name popup
   │                 │     └── Update online count
   │                 └── Pan map to fit all markers
   │
   └── If Leaflet import fails:
         └── Show fallback message / empty map area
   │
3. Renders:
   ├── "X Riders Online" heading
   └── Map container (full height)
```

## Flow 8: Data Export (CSV)

```
1. Any page with exportOrders() or exportCSV():
   │
2. Build rows array from filtered data
   │
3. downloadCSV(filename, rows):
   ├── Map each row object → array of csvValue(field)
   ├── Join with commas + \n
   ├── Prepend header row from Object.keys(rows[0])
   ├── Create Blob with BOM for Excel compatibility
   ├── Create <a> element, click to download
   └── Revoke object URL
```

## Flow 9: Dark Mode

```
1. User clicks moon/sun icon in sidebar bottom
   │
2. setDark(!dark):
   ├── Toggle localStorage "foodhubbie-admin-theme"
   └── Update style vars:
         ├── --bg: #0f0f0f (dark) / #f5f5f5 (light)
         ├── --sideBg: #1a1a1a (dark) / #ffffff (light)
         └── --textCol: #ffffff (dark) / #1a1a1a (light)
   │
3. All components react to CSS variables
```

## Flow 10: Auto-Migration (Boolean Stock → Numeric)

```
1. MenuPage useEffect watches dishes data
   │
2. On each dishes update from Firebase:
   └── For each dish in snapshot:
         └── if typeof dish.stock === "boolean":
               ├── update(Outlet("dishes/{id}"), { stock: 0, threshold: 5 })
               └── dish now requires manual stock entry to appear in POS
   │
3. Runs on every data refresh — idempotent
4. New outlets start clean (no boolean stock)
```
