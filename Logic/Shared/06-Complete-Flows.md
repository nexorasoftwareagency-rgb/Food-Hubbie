# Shared — Complete Flows

## Flow 1: Admin Login to Dashboard

```
User enters email/password
  → signInWithEmailAndPassword()
  → Firebase Auth authenticates
  → useEffect onAuthStateChanged sets user
  → useEffect reads /admins/{user.uid}
  → Gets businessId, outletId, outletName, outletAddress
  → Sets _bizId, _outletId globals
  → setOutletContext() stored in localStorage
  → DashboardPage renders with scoped data
  → All subsequent Outlet() paths are scoped to this business/outlet
```

**Firebase reads on login:**
```
auth → admins/{uid}
     ↓
businesses/{bizId}/outlets/{outletId}/orders  (real-time)
businesses/{bizId}/outlets/{outletId}/dishes  (real-time)
businesses/{bizId}/outlets/{outletId}/categories (real-time)
```

---

## Flow 2: POS Walk-in Order (Full Lifecycle)

```
Admin opens POS page
  → onValue(Outlet("dishes")) — real-time menu stream
  → onValue(Outlet("categories")) — real-time categories stream
  → Menu grid renders with stock badges

Admin taps a dish card
  → openSelection(dish) — opens modal
  → User selects size, addons, quantity
  → addToCart() — adds to cart state
  → Cart displays with itemized pricing

Admin enters customer info
  → Name, phone (validated 10-digit regex), order type, notes

Admin taps "Record Sale"
  → handleCheckout():
      1. Validate cart not empty
      2. Validate phone (if filled)
      3. Validate _outletId not null
      4. Fetch fresh stock: get(Outlet("dishes"))
      5. For each cart item: check stock ≥ qty
      6. Generate orderId: get(metadata/orderSequence) → ++seq → YYYYMMDD-NNNN
      7. Build orderData: cart, subtotal, discVal, taxVal, total, payMethod, type, notes, outletAddress
      8. set(Outlet("orders/{orderId}"), orderData) — Write to Firebase
      9. update(Outlet("metadata/orderSequence"), seqNum)
      10. For each cart item: update(Outlet("dishes/{dishId}"), { stock: stock - qty })
      11. Show success toast
      12. Open print receipt in new window
      13. clearCart() — reset all state

If insufficient stock:
  → Toast error: "Biryani: only 3 in stock, you ordered 5"
  → Cart preserved, user adjusts

BOT picks up:
  → status-monitor.js detects child_changed on orders/
  → Status is "Confirmed" → send WhatsApp to customer
```

---

## Flow 3: WhatsApp Customer Order (Bot)

```
Customer sends "Hi" on WhatsApp
  → Bot index.js receives message
  → Baileys WhatsApp library emits message event
  → commands.js handles message
  
Customer places order through conversation
  → Bot builds order data
  → Bot writes to Firebase:
    set(resolvePath("orders/{orderId}", biz, outlet), orderData)
    → Status: "Placed"
  
Admin Dashboard (LiveOps) detects:
  → onValue(Outlet("orders")) — real-time listener
  → New order appears in Placed column
  
Admin advances status:
  → Click "Confirm" → update(Outlet("orders/{id}"), { status: "Confirmed" })
  → Bot listener detects change
  → Bot sends WhatsApp: "Your order has been confirmed!"

(continues through all 8 statuses — see Bot/06-Complete-Flows.md)
```

---

## Flow 4: Rider Assignment & Delivery

```
Admin opens LiveOps
  → Order at "Ready" status
  → Advance button selects rider
  → update(orders/{id}, { status: "Out for Delivery", riderId, riderName })
  
BOT detects riderId change:
  → notifyRiderAssignment() — sends WhatsApp to rider
  → Rider app refreshes → sees new delivery
  
Rider delivers:
  → Admin advances to "Reached Drop Location"
  → Bot sends OTP to customer via WhatsApp
  → Customer shares OTP with rider
  → Admin enters OTP → advances to "Delivered"
  → Bot sends: "Order delivered! Thank you"
```

---

## Flow 5: Stock Migration (Boolean → Numeric)

```
Legacy data: { stock: true } or { stock: false }

On first MenuPage load after migration:
  → onValue(Outlet("dishes")) reads all dishes
  → Auto-migration logic checks: typeof d.stock === "boolean"
  → If true/false → update(Outlet("dishes/{id}"), { stock: 0, threshold: 5 })
  → Sets d.stock = 0 in local state
  → Dish appears as "OUT OF STOCK" in POS
  → Admin must set numeric stock quantity manually

New data: { stock: 50, threshold: 5 }
  → POS filter: (d.stock || 0) > 0 — only shows when stock > 0
  → POS badge: green "✓ 50" when stock > threshold, orange "⚠ 3" when ≤ threshold
  → Checkout decrements stock: stock - qty
```

---

## Flow 6: Firebase Path Resolution Decision Tree

```
resolvePath(path, businessId, outletId)
  │
  ├── path empty? → return ""
  │
  ├── path starts with "botCommands"?
  │   → return "bot/{businessId}/{outletId}/{rest of path}"
  │
  ├── root node in GLOBAL_NODES?
  │   → return path (no scoping)
  │   (admins, riders, riderStats, bot, logs, superAdmin, businesses, platformConfig)
  │
  └── otherwise:
      → missing businessId/outletId?
        → warn + return path as-is
      → return "businesses/{businessId}/outlets/{outletId}/{path}"
```

---

## Flow 7: MenuPage Dish CRUD

```
Admin opens MenuPage
  → onValue(Outlet("dishes")) — real-time
  → onValue(Outlet("categories")) — real-time

Admin clicks "Add Dish"
  → openForm(null)
  → Sets default form: stock: 0, threshold: 5, sizes: [{name:"Regular",price:0}]
  → User fills name, category, price, stock qty, threshold, sizes, image URL, addons JSON
  
Admin clicks "Save"
  → handleSave():
    1. Validate: name + category required
    2. Parse sizes from sizeList → { "Half": 180, "Full": 280 }
    3. Parse addons JSON → { "Extra Cheese": 30 }
    4. Build data: { name, category, price, image, order, stock: Number, threshold: Number, sizes, addons }
    5. If editId: update(Outlet("dishes/{editId}"), data)
    6. If new: push(Outlet("dishes"), data) → Firebase generates key
    7. Toast success
    8. Close form
    9. onValue listener auto-updates list in real-time
```
