# Admin Dashboard — Connecting Nodes

## 1. App Entry → Auth → Firebase Context

```
main.jsx
  └── <App />  (createRoot → #root)
        │
        ├── Firebase init at firebase.js
        │     ├── initializeApp(firebaseConfig) → app
        │     ├── getDatabase(app) → db
        │     ├── getAuth(app) → auth
        │     ├── getStorage(app) → storage
        │     ├── setOutletContext(bizId, outletId) — sets module-level globals
        │     └── Outlet(path) — creates scoped ref
        │
        ├── onAuthStateChanged(auth)
        │     ├── null → show login screen (orange gradient + GlassCard)
        │     └── user →
        │           ├── read admins/{user.uid} → bizId, outletId, outletName, outletAddress
        │           ├── set _bizId, _outletId globals
        │           ├── setOutletContext(bizId, outletId)
        │           └── set outletInfo state
        │
        └── render layout:
              ├── style tag (fonts, scrollbar, animations)
              ├── sidebar (desktop: fixed, mobile: overlay)
              ├── header (sticky: title + outlet name + bell + avatar)
              ├── main:
              │     └── PAGES[page] component (showToast, outletInfo)
              ├── mobile-bottom-nav (5 items)
              └── Toast (conditional)
```

## 2. Sidebar → Navigation → Page Switching

```
sidebar
  ├── Logo + brand name (collapsed: icon only)
  ├── Collapse toggle button (saves to localStorage "foodhubbie-admin-sidebar-collapsed")
  ├── Outlet info card (name + address, hidden when collapsed)
  ├── NAV_GROUPS (5 sections)
  │     └── Each nav item → onClick → setPage(id)
  │           └── setPage → localStorage.setItem("foodhubbie-admin-page", id)
  │           └── renders PAGES[page]
  └── Bottom:
        ├── Dark mode toggle → setDark(!dark) → localStorage + style vars
        └── Logout → signOut(auth) → reset user/outletInfo
```

## 3. Page Component → Firebase Data Flow

All pages (except mock-only) follow this pattern:
```
PAGE COMPONENT
  └── useEffect on mount:
        ├── onValue(Outlet("collection"), snap => setData(snap.val()))
        └── return () => off(Outlet("collection"))

  └── Handler functions:
        ├── push(Outlet("collection"), data) — create
        ├── update(Outlet("collection/{id}"), data) — update
        ├── remove(Outlet("collection/{id}")) — delete
        └── get(Outlet("collection/{id}")) — read once

  └── Render from local state
```

## 4. POS Checkout → Firebase Write Sequence

```
handleCheckout()
  │
  ├── 1. Validate phone (regex: /^[0-9]{10}$/)
  ├── 2. Validate _outletId exists
  ├── 3. Read orderSequence from Outlet("metadata/orderSequence") (outlet root)
  │     └── Generate orderId = dateStr + "-" + (seq + 1).padStart(4, "0")
  │         e.g., "20260525-0001"
  │
  ├── 4. Fetch ALL dishes fresh via get(Outlet("dishes")):
  │     └── For each cart item:
  │           └── Validate qty <= freshDishes[item.id].stock, else throw error toast
  │
  ├── 5. Compute:
  │     ├── subtotal = sum(item.price * item.qty)
  │     ├── discVal = subtotal * (discount / 100)
  │     ├── taxVal = (subtotal - discVal) * 0.05
  │     └── grandTotal = subtotal - discVal + taxVal
  │
  ├── 6. Write order via set(Outlet("orders/{orderId}"), orderData)
  │     └── status set to "Confirmed" (bypasses "Placed" for counter sales)
  │
  ├── 7. Update sequence:
  │     └── set(Outlet("metadata/orderSequence"), seqNum)
  │
  ├── 8. Decrement stock for each cart item:
  │     └── update(Outlet("dishes/{item.id}"), { stock: newStock })
  │
  ├── 9. Print receipt:
  │     └── window.open("data:text/html,<html body onload=window.print()>...") — inline HTML in data URL
  │     └── Print dialog opens automatically; user must close tab manually
  │
  └── 10. clearCart() — resets cart, discount, name, phone, notes, orderType (payMethod unchanged)
```

## 5. Order Status Flow → Firebase Updates

```
OrdersPage / LiveOpsPage / KitchenPage
  │
  ├── updateStatus(orderId, newStatus)
  │     ├── Validate SEQ.indexOf(currentStatus) + 1 === SEQ.indexOf(newStatus)
  │     ├── If newStatus === "Out for Delivery":
  │     │     └── Validate riderId exists on order
  │     ├── If newStatus === "Cancelled":
  │     │     └── Validate status !== "Delivered"
  │     └── update(Outlet("orders/{orderId}"), { status, paymentStatus })
  │
  ├── assignRider(orderId, riderId)
  │     ├── get(ref(db, "riders/{riderId}")) → rider data
  │     └── update(Outlet("orders/{orderId}"), {
  │           riderId, assignedRider, riderName, riderPhone, assignedAt
  │         })
  │
  └── deleteOrder(orderId)
        └── remove(Outlet("orders/{orderId}"))
```

## 6. Menu CRUD → Firebase

```
openForm(dish) — populate form from dish data or defaults
  └── handleSave():
        ├── Validate required fields (name, price)
        ├── Build sizes object from sizeList
        ├── Parse addons JSON
        ├── If editId:
        │     └── update(Outlet("dishes/{editId}"), formData)
        └── Else:
              └── push(Outlet("dishes"), formData)

handleDelete(id):
  └── remove(Outlet("dishes/{id}"))
```

## 7. Settings → Firebase

```
handleSaveStore():
  ├── validateCoords(lat, lng)
  ├── validateGSTIN(gstin)
  ├── validateFSSAI(fssai)
  └── update(Outlet("settings/Store"), { ...fields, updatedAt: serverTimestamp() })

handleSaveDelivery():
  └── update(Outlet("settings/Delivery"), { ...fields, slabs })
```

## 8. Auto-Migration (MenuPage)

```
useEffect on dishes data:
  └── For each dish:
        └── if typeof dish.stock === "boolean":
              └── update(Outlet("dishes/{id}"), { stock: 0, threshold: 5 })
```

Runs every time dishes data changes from Firebase.

## 9. Live Tracker → Riders Node

```
LiveTrackerPage:
  ├── useEffect:
  │     ├── Dynamically import Leaflet
  │     ├── Initialize map
  │     └── onValue(ref(db, "riders")) — for each rider:
  │           ├── Update online count
  │           └── Add/update/remove map marker
  └── Render map container
```

## 10. CustomersPage → Cross-Collection Aggregation

```
useEffect:
  ├── onValue(Outlet("customers")) — customer profiles
  └── onValue(Outlet("orders")) — order history

Computed:
  └── For each customer:
        ├── Filter orders where order.phone === customer key
        ├── orderCount = filtered orders length
        └── ltv = sum of filtered orders' total
  └── Sort by LTV descending
```

## 11. Shared Components → Props Flow

```
App.jsx
  └── <PageComponent showToast={showToast} outletInfo={outletInfo} />
        │
        ├── showToast — 3.5s auto-dismiss toast
        │     ├── "success" → green (#10b981)
        │     ├── "error" → red (#ef4444)
        │     └── "warning" → orange (#E84908)
        │
        └── outletInfo — { name, address }
              └── Used in POSPage for receipt outletAddress
              └── Used in header display
```

## 12. Modular Sections ↔ App.jsx Disconnect

```
sections/*.jsx (standalone components)
  ├── Import components from ../components/
  ├── Import useRealtimeData from ../hooks/useRealtimeData
  ├── Import utils from ../utils/
  └── NOT used by App.jsx anywhere

App.jsx (monolithic)
  ├── All page components defined inline
  ├── All shared components defined inline
  ├── All helpers defined inline
  └── Firestore via firebase.js imports
```

The modular sections and the monolithic app coexist but are disconnected. The sections/ files could replace the inline pages in a refactor.

## 13. Keyboard Shortcuts (POS Page)

```
useEffect:
  └── document.addEventListener("keydown", handler)
        ├── if selModal && key === "Escape":
        │     └── close modal, clear editKey
        └── if selModal && key === "Enter":
              └── addToCartRef.current()
  └── return () => removeEventListener
```

`addToCartRef` (useRef) used to avoid re-attaching effect on addToCart identity change.

## 14. Order Items Count Helper

```
orderItemsCount(order):
  ├── Array.isArray(cart) → cart.length
  ├── typeof cart === "object" → Object.keys(cart).length
  ├── typeof cart === "number" → 1 (scalar count)
  └── default → 0
```

Used across multiple pages for consistent display.
