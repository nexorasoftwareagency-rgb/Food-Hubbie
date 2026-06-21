# POS & Walk-in — Complete Reference

All code, logics, connecting nodes, state, click handlers, receipt printing, and discount integration for the Roshani ERP Point-of-Sale system.

---

## 1. Architecture Overview

### Module Map

```
Admin/js/features/pos.js          (917L)  — Core POS logic: menu, cart, modal, checkout
Admin/js/features/printing.js     (266L)  — Receipt generation, iframe print, reprint
Admin/js/features/discount-evaluator.js (161L) — Shared discount engine (Admin-side)
Admin/receipt-templates.js        (188L)  — Thermal receipt HTML template
Admin/js/state.js                         — Global state (walkinCart, discounts, etc.)
Admin/js/main.js                          — Click handler delegation (20+ actions)
Admin/js/ui.js                            — Tab switching, POS immersion mode
Admin/js/l10n.js                          — i18n keys (analytics.*) — POS not yet i18n'd
bot/index.js                     (2667L)  — WhatsApp bot (online orders, customer sync)
bot/discount-engine.js           (171L)   — Bot-side discount evaluator (mirrors Admin)
```

### File Relationships

```
pos.js
  ├── imports → discount-evaluator.js (evaluateDiscount, recordDiscountUsage, clearDiscountCache)
  ├── imports → inventory.js (autoDeductStock)
  ├── imports → printing.js (printOrderReceipt)
  ├── imports → state.js (walkinCart, walkinDiscount, etc.)
  ├── imports → utils.js (standardizeOrderData, haptic, logAudit)
  └── imports → l10n.js (t)

printing.js
  ├── imports → receipt-templates.js (window.ReceiptTemplates)
  ├── imports → orders.js (updateStatus — for Dine-in auto-complete)
  └── imports → firebase.js (Outlet, get, query)

bot/index.js
  ├── imports → discount-engine.js (evaluateDiscount, validateCouponCode, recordDiscountUsage)
  └── writes to → customers/{phone} (shared with POS lookup)
```

---

## 2. State Variables (`Admin/js/state.js`)

| Variable | Line | Type | Default | Purpose |
|---|---|---|---|---|
| `allWalkinDishes` | 10 | `Array` | `[]` | All dishes fetched from Firebase `dishes` node |
| `activeWalkinCategory` | 11 | `String` | `'All'` | Current category filter |
| `walkinCart` | 12 | `Object` | `{}` | Cart items keyed by composite key `dishId::size::addons` |
| `walkinPayMethod` | 13 | `String` | `'Cash'` | Selected payment method |
| `walkinDiscount` | 37 | `Number` | `0` | Flat manual discount in ₹ |
| `walkinDiscountPct` | 38 | `Number` | `0` | Percentage manual discount |
| `walkinAutoDiscount` | 39 | `Object\|null` | `null` | Auto-applied discount: `{ discount, amount, label, source }` |
| `walkinCouponCode` | 40 | `String\|null` | `null` | User-entered coupon code |
| `currentPOSModalDish` | 41 | `Object\|null` | `null` | Dish currently being configured in modal |
| `currentPOSModalQty` | 42 | `Number` | `1` | Quantity in modal |
| `currentPOSModalSize` | 43 | `Object\|null` | `null` | `{ name, price }` |
| `currentPOSModalAddons` | 44 | `Object` | `{}` | Addons map: `{ name: price }` |
| `editingCartKey` | 46 | `String\|null` | `null` | Cart key being edited (for re-adding to cart) |

---

## 3. Code Logics — All Functions

### 3a. Menu & Category (`pos.js`)

| Line | Function | Signature | Purpose |
|---|---|---|---|
| 18 | `loadWalkinMenu` | `async ()` | Fetches dishes from `Outlet.ref("dishes")`, populates `state.allWalkinDishes`, loads categories, renders tabs and grid |
| 54 | `renderWalkinCategoryTabs` | `()` | Renders category filter tabs with `data-action="filterWalkinByCategory"` |
| 77 | `filterWalkinByCategory` | `(category, el)` | Updates `state.activeWalkinCategory`, toggles active CSS, calls `applyWalkinFilters()` |
| 89 | `applyWalkinFilters` | `()` | Combines search input + category filter, calls `renderWalkinDishGrid()` |
| 104 | `renderWalkinDishGrid` | `(dishes)` | Renders dish cards with `data-action="openPOSSelectionModal"` and `data-id` |

### 3b. Selection Modal (`pos.js`)

| Line | Function | Signature | Purpose |
|---|---|---|---|
| 140 | `openPOSSelectionModal` | `async (dishId)` | Opens side-panel modal for size/addon/qty selection; sets `state.currentPOSModalDish`, resets modal state |
| 233 | `hidePOSSelectionModal` | `()` | Hides the selection modal |
| 242 | `selectPOSSize` | `(name, price, el)` | Updates `state.currentPOSModalSize`, recalculates total |
| 250 | `togglePOSAddon` | `(name, price, el)` | Toggles addon in `state.currentPOSModalAddons` |
| 264 | `adjustPOSModalQty` | `(delta)` | Adjusts `state.currentPOSModalQty` (min 1), recalculates total |
| 270 | `updatePOSModalTotal` | `()` (internal) | Recalculates modal total: `(size + addons) * qty` |

### 3c. Cart Operations (`pos.js`)

| Line | Function | Signature | Purpose |
|---|---|---|---|
| 281 | `addToWalkinCartFromModal` | `()` | Creates cart key `${dishId}::${size}::${addons.sort().join('\|')}`, adds/updates `state.walkinCart[cartKey]` |
| 341 | `removeFromWalkinCart` | `(cartKey)` | Deletes item from `state.walkinCart` |
| 346 | `walkinQtyChange` | `(cartKey, delta)` | Adjusts quantity in cart (min 1) |
| 353 | `clearWalkinCart` | `()` | Resets entire cart + discount + form fields + coupon |
| 372 | `renderWalkinCart` | `()` | Full cart render: items, subtotal, discount calculation, total, mobile summary |
| 491 | `updateMobileCartSummaryState` | `(count, total)` | Shows/hides mobile floating cart bar |
| 514 | `toggleMobileCart` | `()` | Scrolls to cart on mobile |
| 852 | `openCartAddonPicker` | `async (cartKey)` | Opens modal in "edit addons" mode for an existing cart item |

### 3d. Discount & Coupon (`pos.js`)

| Line | Function | Signature | Purpose |
|---|---|---|---|
| 527 | `checkWalkinCustomer` | `async ()` | Looks up phone in Firebase `customers/{phone}`, auto-fills name |
| 543 | `setDiscount` | `(amt)` | Sets `state.walkinDiscount`, clears percentage |
| 549 | `setDiscountPct` | `(pct)` | Sets `state.walkinDiscountPct`, clears flat |
| 555 | `applyWalkinCoupon` | `async ()` | Validates coupon via `evaluateDiscount()`, sets `state.walkinAutoDiscount` |
| 613 | `clearWalkinCoupon` | `()` | Clears coupon and auto discount |
| 625 | `selectWalkinPayment` | `(method, el)` | Sets `state.walkinPayMethod` |

### 3e. Sale Submission (`pos.js`)

| Line | Function | Signature | Purpose |
|---|---|---|---|
| 635 | `submitWalkinSale` | `async ()` | **THE MAIN SALE FUNCTION** — validates prices, calculates discount, generates orderId, saves order, deducts inventory, records discount usage, updates customer LTV, prints receipt, clears cart |

---

## 4. submitWalkinSale — 12-Step Transaction Flow

```
Step 1: Cart Validation (L636-639)
  └─ Checks state.walkinCart is not empty

Step 2: Form Data Extraction (L642-646)
  └─ Gets phone, name, tableNo, note from DOM inputs

Step 3: Button Disable (L648-652)
  └─ Shows "Processing..." spinner, disables submit button

Step 4: Price Validation (L656-700)  ← PHASE 3.22
  ├─ Fetches fresh dishes + categories from Firebase in parallel
  ├─ For each cart item: validates base price from sizes
  ├─ Validates addon prices from category
  └─ Corrects any price manipulation detected

Step 5: Discount Calculation (L702-740)
  ├─ Priority: manual flat > manual percent > auto-evaluate
  ├─ Auto-evaluation calls evaluateDiscount({ customer, subtotal, couponCode, cart })
  ├─ customer fetched from customers/{phone} if phone.length >= 10
  └─ Returns: { discountValue, discountId, discountLabel, discountSource }

Step 6: Order ID Generation (L742-748)
  └─ runTransaction on Outlet.current/metadata/orderSequence/{dateStr}
     Format: YYYYMMDD-NNNN (e.g., 20260604-0001)

Step 7: Order Data Construction (L750-772)
  └─ {
       orderId, items, subtotal,
       discount: discountValue,
       discountId, discountLabel, discountSource,
       total, paymentMethod, customerName, phone,
       customerNote, tableNo,
       status: "Confirmed",    ← POS orders start as Confirmed
       type: "Dine-in",        ← POS orders are Dine-in type
       stockDeducted: true,
       timestamp: serverTimestamp(),
       createdAt: new Date().toISOString(),
       outlet: Outlet.current,
       assignedRider: "",
       createdBy: auth.currentUser?.email || 'admin'
     }

Step 8: Firebase Save (L775)
  └─ set(Outlet.ref('orders/${orderId}'), orderData)

Step 9: Inventory Deduction (L778)
  └─ autoDeductStock(items) — matches item names against inventory/

Step 10: Discount Usage Recording (L781-795)
  └─ recordDiscountUsage({ discountId, orderId, customerPhone,
       amountGiven, channel: 'pos', discountLabel, discountSource })
     └─ Atomically bumps discounts/{id}/stats via runTransaction

Step 11: Customer LTV Update (L798-824)
  └─ runTransaction on customers/{phone}
     ├─ Creates record if new (orderCount: 1, totalSpent: total)
     ├─ Increments orderCount++, totalSpent += total
     ├─ Updates lastSeen, lastAddress: 'Walk-in'
     └─ If firstOrder discount: sets firstOrderDiscountUsed, firstOrderDiscountId

Step 12: Receipt + Cleanup (L831-845)
  ├─ printOrderReceipt(orderData)
  └─ clearWalkinCart()
```

---

## 5. Receipt & Printing

### 5a. `printing.js` — Exported Functions

| Line | Function | Signature | Purpose |
|---|---|---|---|
| 21 | `printOrderReceipt` | `async (rawOrder, isReprint=false)` | Main receipt function; loads store settings, generates thermal receipt HTML, caches HTML on order, prints via iframe |
| 194 | `closeReceiptPreview` | `()` | Closes preview modal |
| 203 | `printReceiptFromPreview` | `()` | Triggers print from preview |
| 215 | `printReceiptById` | `async (orderId)` | Fetches order from Firebase, auto-completes Dine-in orders, prints |
| 248 | `reprintLastPosReceipt` | `async ()` | Queries Firebase for most recent `type: "Walk-in"` order, reprints it |

### 5b. `printOrderReceipt` Flow

```
1. standardizeOrderData(rawOrder) — normalize items from cart/array/object
2. If not reprint AND rawOrder.receiptHtml exists → print via iframe directly (cached)
3. Load store settings from Outlet.ref("settings/Store") + settings/Display (5-min cache)
4. Build store object: { entityName, storeName, address, gstin, fssai, tagline, config }
5. ReceiptTemplates.generateThermalReceipt(order, store, isReprint) → HTML string
6. Cache HTML on rawOrder.receiptHtml for future reprints
7. If reprint → showReceiptPreview(html) → modal with iframe
8. If first print → printWithIframe(html) → hidden iframe → iframe.contentWindow.print()
```

### 5c. `printWithIframe` Logic

```
1. Create hidden <iframe> (position:fixed, 0 width/height, no border)
2. Write HTML: doc.open() → doc.write(html) → doc.close()
3. After 400ms: iframe.contentWindow.focus() → iframe.contentWindow.print()
4. After 1000ms: remove iframe from DOM
```

### 5d. `receipt-templates.js` — Thermal Receipt Format

**Layout (80mm thermal width):**

```
┌──────────────────────────────────────┐
│ [Store branding — conditional]       │
│ Entity Name / Store Name             │
│ Address / GSTIN / FSSAI              │
│                                      │
│ ──── CASH MEMO ──── (POS orders)    │
│ ──── ORDER INVOICE ── (online)       │
│                                      │
│ Order: #XXXXXX  Date: DD/MM/YYYY     │
│ Time: HH:MM AM  Pay: Cash            │
│ Table: N (if set)                    │
│                                      │
│ Item           Qty        Amount     │
│ ─────────────────────────────────    │
│ Paneer Tikka    2        ₹360.00     │
│   (Large)                            │
│ Margherita      1        ₹250.00     │
│                                      │
│ Items: 3              Subtotal: ₹610 │
│ 🎁 Discount (Festive): -₹30.50      │
│ ─────────────────────────────────    │
│ NET PAYABLE          ₹579.50         │
│ ─────────────────────────────────    │
│                                      │
│ Customer: Rahul Kumar                │
│ Contact: 9876543210 (if not Walk-in) │
│ Note: (if set, dashed border box)    │
│                                      │
│ [QR: SCAN TO PAY ONLINE]            │
│ [QR: SCAN TO GIVE FEEDBACK]         │
│                                      │
│ Thank You! Visit Again               │
│ Powered by Roshani ERP               │
│ This is a computer generated bill    │
└──────────────────────────────────────┘
```

**Key Logic:**

| Line | Logic |
|---|---|
| 15-23 | Item rendering: name, size (if not "Regular"), qty × price |
| 26-28 | Feedback QR: `api.qrserver.com` with order ID + outlet |
| 87-99 | Store branding: conditional on `store.config.showStoreName`, etc. |
| 98 | Header: `(order.type === 'walkin' || order.type === 'Dine-in') ? 'CASH MEMO' : 'ORDER INVOICE'` |
| 105 | Table number: shown if `order.tableNo` exists |
| 135 | Discount line: `Discount${order.discountLabel ? ' (' + label + ')' : ''}: -₹{amount}` |
| 145 | Phone: hidden if `"Walk-in"` |
| 149-152 | Reprint indicator: "DUPLICATE / REPRINT" bordered box |
| 155-160 | Payment QR: shown if `store.config.showQR !== false && store.paymentQR` |
| 163-168 | Feedback QR: shown if `store.config.showFeedbackQR !== false` |

### 5e. Dine-in Auto-Complete on Print

```
printing.js:233-235:
  if (order.type === 'dine-in' && order.status !== 'Delivered') {
      await updateStatus(orderId, 'Delivered');
  }

orders.js:951-953:
  const isPosSale = (type || '').toLowerCase() === 'dine-in';
  const isPosSkipReady = isPosSale && currentStatus === "Confirmed" && status === "Delivered";
```

Printing a Dine-in receipt auto-marks the order as "Delivered" — POS orders skip "Ready" status.

---

## 6. Discount Engine Integration

### 6a. Dual Implementations

| Component | File | Runtime | Firebase SDK |
|---|---|---|---|
| **Admin/POS** | `discount-evaluator.js` (161L) | Browser (ES module) | Firebase JS SDK via `Outlet.ref()` |
| **WhatsApp Bot** | `discount-engine.js` (171L) | Node.js server | `firebase-admin` via `db.ref()` |

Both share **identical logic** but differ in Firebase access patterns.

### 6b. `evaluateDiscount(ctx)` — Core Algorithm

```js
// Returns: { discount, allApplied, amount, label, source } | null

1. Guard: subtotal <= 0 → return null
2. Feature flag: discounts/featureEnabled === false → return null
3. Fetch all discounts (30s cached)
4. Filter candidates: enabled, within time window, meets minSubtotal, under globalLimit
5. Filter applicable by type:
   - global     → always
   - firstOrder → !customer?.firstOrderDiscountUsed
   - category   → cartHasCategory(cart, d.categoryIds)
   - coupon     → couponCode matches (case-insensitive)
6. Group by exclusiveGroup → pick best per group
7. Priority: firstOrder(4) > coupon(3) > global(2) > category(1)
8. Non-stackable = exclusive; stackable added on top
9. Apply caps: maxCap per discount, never exceed subtotal
10. Return: { discount: primary, allApplied, amount, label, source }
```

### 6c. Discount Types

| Type | Applicability | Label Fallback | Source String |
|---|---|---|---|
| `global` | Always (if enabled/in-window) | "Discount" | `auto:global` |
| `firstOrder` | Customer has no `firstOrderDiscountUsed` | "New Customer Discount" | `firstOrder` |
| `category` | Cart contains items matching `categoryIds` | "Discount" | `auto:category` |
| `coupon` | Customer enters matching `couponCode` | "Discount" | `coupon:CODE` |
| **Manual flat** | Cashier enters ₹ value | N/A | `manual:flat` |
| **Manual percent** | Cashier enters % value | N/A | `manual:percent` |

### 6d. POS Discount Resolution (Priority)

```
Manual flat discount (walkinDiscount > 0)
  → source: 'manual:flat'

Manual percent discount (walkinDiscountPct > 0)
  → source: 'manual:percent'

Auto-evaluate (walkinDiscount === 0 && walkinDiscountPct === 0)
  → calls evaluateDiscount({ customer, subtotal, couponCode, cart })
  → source: 'firstOrder' | 'coupon:CODE' | 'auto:global' | 'auto:category'
```

Manual discounts **always override** auto discounts. When a manual discount is entered, `state.walkinAutoDiscount` is set to `null`.

### 6e. `recordDiscountUsage` — Audit Trail

```js
// Writes to:
Outlet.ref('discountsUsage/{usageId}')  → { discountId, discountLabel, orderId,
  customerPhone, amountGiven, appliedAt, channel: 'pos', source }

Outlet.ref('discounts/{discountId}/stats')  → runTransaction:
  { usedCount: +1, totalDiscountGiven: +amount, lastUsedAt: now }
```

### 6f. First-Order Tracking

```
POS (pos.js:798-824):
  runTransaction(custRef, c => {
      if (!c) return { name, phone, orderCount: 1, totalSpent: total,
          firstOrderDiscountUsed: Date.now(), firstOrderDiscountId: discountId };
      c.orderCount++; c.totalSpent += total;
      if (isFirstOrderDiscount) { c.firstOrderDiscountUsed = Date.now(); }
      return c;
  });

Bot (bot/index.js:1993-1997):
  custData.firstOrderDiscountUsed = Date.now();
  custData.firstOrderDiscountId = user.discountId;
  await updateData(`customers/${cleanPhone}`, custData, user.outlet);
```

---

## 7. Connecting Nodes — Firebase Paths

| Path | Read/Write | Used By | Purpose |
|---|---|---|---|
| `{outlet}/orders/{orderId}` | R/W | POS writes, Bot reads | Order storage |
| `{outlet}/dishes` | R | POS reads | Menu items + prices |
| `{outlet}/categories` | R | POS reads | Category definitions + addon prices |
| `{outlet}/customers/{phone}` | R/W | POS reads (lookup) + writes (LTV) | Customer profiles |
| `{outlet}/inventory` | R | POS reads (via `autoDeductStock`) | Stock management |
| `{outlet}/metadata/orderSequence/{dateStr}` | W (tx) | POS writes | Order ID generation (atomic) |
| `{outlet}/discounts` | R | POS reads (via evaluator) | Discount definitions |
| `{outlet}/discounts/featureEnabled` | R | POS reads (via evaluator) | Feature flag kill-switch |
| `{outlet}/discountsUsage` | W | POS writes (via evaluator) | Discount usage audit log |
| `{outlet}/settings/Store` | R | Printing reads | Store name, address, GSTIN, etc. |
| `{outlet}/settings/Display` | R | Printing reads | Receipt visibility toggles |
| `{outlet}/logs/audit` | W | POS writes | Audit trail for sales |
| `bot/{outlet}/commands` | R | Bot reads | Admin-triggered commands |

### Bot ↔ POS Customer Sync

```
Bot (bot/index.js:1979-1997):
  After online order → writes customers/{phone} with:
    { name, phone, address, location, lastOrderDate, promotionalConsent }

POS (pos.js:527-541):
  checkWalkinCustomer() → reads customers/{phone}
    Auto-fills: walkinCustName = customer.name
    Used for: firstOrder discount eligibility check
```

---

## 8. Click Handlers & UI

### 8a. Static Event Listeners (`main.js` L167-178)

| Button ID | Handler |
|---|---|
| `btnShowPOSSelection` | `pos.openPOSSelectionModal()` |
| `btnPosPrintLast` | `printing.reprintLastPosReceipt()` |
| `btnPosQtyDec` | `pos.adjustPOSModalQty(-1)` |
| `btnPosQtyInc` | `pos.adjustPOSModalQty(1)` |

### 8b. Delegated Click Actions (`main.js` L295-449)

| `data-action` | Handler |
|---|---|
| `openPOSSelectionModal` | `pos.openPOSSelectionModal(id)` |
| `hidePOSSelectionModal` | `pos.hidePOSSelectionModal()` |
| `addToWalkinCartFromModal` | `pos.addToWalkinCartFromModal()` |
| `adjustPOSModalQty` | `pos.adjustPOSModalQty(parseInt(val))` |
| `openCartAddonPicker` | `pos.openCartAddonPicker(id)` |
| `walkinQtyChange` | `pos.walkinQtyChange(id, parseInt(val))` |
| `walkinRemoveItem` | `pos.removeFromWalkinCart(id)` |
| `filterWalkinByCategory` | `pos.filterWalkinByCategory(val, el)` |
| `selectPOSSize` | `pos.selectPOSSize(name, parseFloat(price), el)` |
| `togglePOSAddon` | `pos.togglePOSAddon(name, parseFloat(price), el)` |
| `toggleMobileCart` | `toggleMobileCart(true)` |
| `clearWalkinCart` | `pos.clearWalkinCart()` |
| `submitWalkinSale` | `pos.submitWalkinSale()` |
| `applyWalkinDiscount` | `pos.setDiscount(amt)` or `pos.setDiscountPct(pct)` |
| `applyWalkinCoupon` | `pos.applyWalkinCoupon()` |
| `clearWalkinCoupon` | `pos.clearWalkinCoupon()` |
| `selectWalkinPayment` | `pos.selectWalkinPayment(method, el)` |
| `printReceiptById` | `printing.printReceiptById(id)` |
| `closeReceiptPreview` | `printing.closeReceiptPreview()` |
| `printReceiptFromPreview` | `printing.printReceiptFromPreview()` |

### 8c. Input Event Handlers (`main.js` L481-483)

| Element ID | Event | Handler |
|---|---|---|
| `walkinDishSearch` | `input` | `pos.applyWalkinFilters()` |

### 8d. Keyboard Shortcuts (`main.js` L516-535)

| Key | Handler |
|---|---|
| `Escape` | `pos.hidePOSSelectionModal()` — closes modal on Escape |

### 8e. POS Immersion Mode (`ui.js` L92-119)

When switching to `tabId === 'walkin'`:

**Mobile (< 768px):**
- Adds `pos-immersion-active` class to `<body>`
- Hides `#mobileAppHeader`
- Adds `pos-fullscreen` class to `#tab-walkin`
- Creates back button `#posExitBtn` with `pos-back-btn mobile-only` class → navigates to dashboard

**Desktop:**
- No immersion changes

**Leaving walkin tab:**
- Removes all immersion classes
- Shows mobile header

### 8f. Tab Data Refresh (`ui.js` L232-235)

```js
case 'walkin': {
    const { loadWalkinMenu } = await mod('pos');
    loadWalkinMenu();  // Always fresh load on tab switch
    break;
}
```

---

## 9. HTML Structure

### 9a. Sidebar Navigation (`index.html` L254-258)

```html
<li id="menu-walkin" title="Open Point of Sale (POS) Interface">
    <button data-action="switchTab" data-tab="walkin" class="nav-btn">
        <i data-lucide="monitor"></i> <span>POS Control</span>
    </button>
</li>
```

### 9b. Mobile Bottom Nav (`index.html` L1617-1620)

```html
<button class="nav-item" data-tab="walkin" data-action="switchTab" title="Point of Sale" aria-label="POS">
    <i data-lucide="shopping-cart"></i>
    <span>Walk-in</span>
</button>
```

### 9c. POS Selection Modal (`index.html` L1897-1955)

```html
<div id="posSelectionModal" class="modal pos-side-panel">
    <div class="modal-content glass-card selection-panel-v4">
        <div class="modal-header">
            <h2 id="posModalDishName">Select Options</h2>
            <p id="posModalDishCategory"></p>
            <button class="close-btn" data-action="hidePOSSelectionModal">X</button>
        </div>
        <div class="modal-body p-20">
            <div id="posSizeSection"><div id="posSizeGrid"></div></div>
            <div id="posAddonsSection"><div id="posAddonsList"></div></div>
            <button id="btnPosQtyDec" data-action="adjustPOSModalQty" data-val="-1">-</button>
            <span id="posModalQty">1</span>
            <button id="btnPosQtyInc" data-action="adjustPOSModalQty" data-val="1">+</button>
        </div>
        <div class="modal-footer selection-footer">
            <div id="posModalTotal">₹0</div>
            <button id="posAddBtn" data-action="addToWalkinCartFromModal">Add to Cart</button>
        </div>
    </div>
</div>
```

### 9d. Mobile Cart Summary Bar (`index.html` L1642-1653)

```html
<div id="mobileCartSummary" class="mobile-cart-summary hidden mobile-only cursor-pointer"
     data-action="toggleMobileCart">
    <div id="mobileCartCount">0 Items</div>
    <div id="mobileCartTotal">₹0</div>
    <button class="btn-checkout-mobile">View Cart</button>
</div>
```

### 9e. Receipt Preview Modal (`index.html` L2070-2088)

```html
<div id="receiptPreviewModal" class="modal hidden">
    <div class="modal-content" style="max-width:520px;width:95%;">
        <div class="modal-header">
            <h3 class="modal-title"><i data-lucide="receipt"></i> Receipt Preview</h3>
            <button class="close-btn" data-action="closeReceiptPreview">✕</button>
        </div>
        <div class="modal-body" style="padding:0;height:65vh;overflow:hidden;">
            <iframe id="receiptPreviewFrame" style="width:100%;height:100%;border:none;background:#fff;"></iframe>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" data-action="closeReceiptPreview">Close</button>
            <button class="btn-primary" data-action="printReceiptFromPreview">🖨️ Print</button>
        </div>
    </div>
</div>
```

### 9f. ⚠️ Missing: `#tab-walkin` HTML

The entire `#tab-walkin` div and all child elements are **absent from `index.html`**. The following elements are referenced by `pos.js` but have no HTML definition:

- `walkinDishGrid` — dish grid container
- `walkinCategoryTabs` — category filter tabs
- `walkinDishSearch` — search input
- `walkinCartItems` — cart items container
- `walkinSubtotal`, `walkinTotal` — price displays
- `walkinDiscountRow`, `walkinDiscountVal`, `walkinDiscount` — discount inputs
- `walkinCouponCode`, `walkinCouponHint`, `walkinCouponClearBtn` — coupon UI
- `walkinCustPhone`, `walkinCustName`, `walkinTableNo`, `walkinCustNote` — customer fields
- `walkinSubmitBtn` — submit button

The CSS in `mobile-overrides.css` extensively styles `#tab-walkin` (12+ rules), confirming this tab was designed with a full layout. The tab content is likely **generated dynamically** or was removed during a refactor while JS/CSS references remain. **The POS feature's main tab UI may currently be non-functional until the HTML is restored.**

---

## 10. Bot/POS Interaction

### 10a. POS Order Detection in Bot (`bot/index.js` L715-748)

```js
const type = (order.type || order.orderType || "Walk-in");
const isDineIn = typeLower.includes("dine") || typeLower.includes("walk");
```

### 10b. Dine-in Notifications (`bot/index.js` L800-802)

```js
if (isDineIn && isNew) {
    msg = `WELCOME TO ROSHANI ${order.outlet?.toUpperCase()}! Your counter order has been CONFIRMED!`;
}
```

POS orders get a special "Welcome / counter order confirmed" notification instead of the full online flow.

### 10c. Revenue Counting (`bot/index.js` L933)

```js
if (order.status === "Delivered" || order.status === "Confirmed" || order.paymentStatus === "Paid") {
    outletRevenue += parseFloat(order.total || 0);
}
```

POS orders with `status: "Confirmed"` are counted as revenue in reports.

### 10d. Dine-in Time Buffer (`bot/index.js` L1389-1393)

```js
const timeBuffer = isDineIn ? 1800000 : 10000;  // 30 minutes vs 10 seconds
```

Dine-in orders get a 30-minute grace period for the bot to process them.

### 10e. Bot Saves Customer for POS (`bot/index.js` L1979-1997)

```js
if (user.phone) {
    const cleanPhone = String(user.phone).replace(/\D/g, '').slice(-10);
    await updateData(`customers/${cleanPhone}`, {
        name, phone: cleanPhone, address, location,
        lastOrderDate: new Date().toISOString(),
        promotionalConsent: true
    }, user.outlet);
}
```

Bot saves customer profiles to `customers/{phone}` so POS can look them up via `checkWalkinCustomer()`.

---

## 11. Service Worker Caching

In `Admin/sw.js` (Line 36), both are pre-cached for offline capability:

```js
'./js/features/pos.js',
'./js/features/printing.js',
'receipt-templates.js',
```

---

## 12. Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    POS WALK-IN FLOW                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User clicks dish tile                                  │
│    → data-action="openPOSSelectionModal" (data-id)      │
│    → main.js delegate → pos.openPOSSelectionModal(id)   │
│    → Sets state.currentPOSModalDish                     │
│    → Opens #posSelectionModal (side panel)              │
│                                                         │
│  User picks size/addons/qty                             │
│    → selectPOSSize / togglePOSAddon / adjustPOSModalQty │
│    → updatePOSModalTotal() → shows ₹{(size+addons)*qty} │
│                                                         │
│  User clicks "Add to Cart"                              │
│    → addToWalkinCartFromModal()                          │
│    → cartKey = "${dishId}::${size}::${sortedAddons}"    │
│    → state.walkinCart[cartKey] = { name, size, addons,  │
│        qty, unitPrice, total, category, id }            │
│    → renderWalkinCart() → shows cart items + subtotal   │
│                                                         │
│  User adjusts cart                                       │
│    → walkinQtyChange / walkinRemoveItem                  │
│    → renderWalkinCart()                                  │
│                                                         │
│  User applies discount                                   │
│    → setDiscount(amt) → state.walkinDiscount = amt       │
│    → OR setDiscountPct(pct) → state.walkinDiscountPct    │
│    → OR applyWalkinCoupon() → evaluateDiscount()         │
│      → state.walkinAutoDiscount = { amount, label, ... } │
│    → renderWalkinCart() recalculates total               │
│                                                         │
│  User submits sale                                       │
│    → submitWalkinSale()                                  │
│    → Step 1: Validate cart not empty                     │
│    → Step 2: Extract phone, name, table, note            │
│    → Step 3: Disable button, show spinner                │
│    → Step 4: Fresh Firebase price validation             │
│    → Step 5: Resolve discount (manual > auto)            │
│    → Step 6: Generate orderId (transaction)              │
│    → Step 7: Build orderData { type:"Dine-in",          │
│        status:"Confirmed", discount, discountId, ... }  │
│    → Step 8: Save to orders/{orderId}                    │
│    → Step 9: autoDeductStock(items)                      │
│    → Step 10: recordDiscountUsage(channel:'pos')         │
│    → Step 11: Customer LTV update (runTransaction)       │
│    → Step 12: printOrderReceipt() → clearWalkinCart()    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    RECEIPT FLOW                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  printOrderReceipt(orderData)                           │
│    → standardizeOrderData() — normalize items            │
│    → Load store settings (5-min cache)                   │
│    → ReceiptTemplates.generateThermalReceipt()           │
│    → Cache HTML on order.receiptHtml                     │
│    → printWithIframe(html)                               │
│      → Hidden iframe → doc.write(html) → print()         │
│                                                         │
│  reprintLastPosReceipt()                                │
│    → Query last order where type="Walk-in"              │
│    → printOrderReceipt(order, isReprint=true)            │
│    → showReceiptPreview(html) → modal with iframe        │
│                                                         │
│  printReceiptById(orderId)                              │
│    → Fetch order from Firebase                           │
│    → Auto-complete Dine-in → Delivered                   │
│    → printOrderReceipt(order, isReprint=true)            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                 DISCOUNT FLOW                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Manual discount                                        │
│    → Cashier enters ₹ or % in input                     │
│    → state.walkinDiscount = amt (or walkinDiscountPct)   │
│    → Clears auto discount + coupon                       │
│    → renderWalkinCart() shows "-₹{amt}"                  │
│                                                         │
│  Coupon discount                                        │
│    → Cashier enters code in coupon input                 │
│    → applyWalkinCoupon()                                 │
│    → evaluateDiscount({ customer, subtotal, couponCode })│
│    → state.walkinAutoDiscount = result                   │
│    → renderWalkinCart() shows "-₹{amt} ({label})"        │
│                                                         │
│  Auto discount (no manual, no coupon)                   │
│    → submitWalkinSale() calls evaluateDiscount()         │
│    → Best of: firstOrder > coupon > global > category    │
│    → Applied if no manual override                       │
│                                                         │
│  On submit                                               │
│    → discountValue persisted on order                    │
│    → recordDiscountUsage() → discountsUsage/ + stats     │
│    → Customer firstOrderDiscountUsed set if applicable   │
│    → Receipt shows: "🎁 Discount (Label): -₹{amount}"   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 13. Known Issues & Notes

### Missing HTML
The `#tab-walkin` div is absent from `index.html`. All child elements referenced by `pos.js` have no HTML definition. The POS tab content is either dynamically generated or was removed during a refactor. **The main POS tab UI may be non-functional until the HTML is restored.**

### Price Validation
POS performs a fresh Firebase fetch of dishes + categories at checkout time (Step 4) to detect and correct any client-side price manipulation. This is a security measure.

### Dine-in Auto-Complete
Printing a Dine-in receipt auto-marks the order as "Delivered" — POS orders skip "Ready" status entirely.

### Discount Override
Manual discounts (entered by cashier) always win over auto-discounts. The auto-discount is logged but not applied when manual is present.

### Bot 30-Minute Buffer
Dine-in orders get a 30-minute time buffer in the bot (vs 10 seconds for online orders) to account for the longer preparation-to-delivery window.

### Service Worker
Both `pos.js` and `printing.js` are pre-cached by the service worker for offline POS capability.
