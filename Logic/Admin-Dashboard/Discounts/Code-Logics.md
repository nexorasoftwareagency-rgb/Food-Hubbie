# Admin Discounts Module (discounts.js + discount-evaluator.js + discountsReports.js) — Code Logics

## Overview
Three-file Admin-side discount system:
1. `discount-evaluator.js` (161L) — shared evaluator (same algorithm as bot's `discount-engine.js`)
2. `discounts.js` (331L) — CRUD UI with active/scheduled/expired tabs
3. `discountsReports.js` (284L) — analytics modal (KPIs, per-discount breakdown, channel split, CSV export)

## discount-evaluator.js
- `evaluateDiscount({ customer, subtotal, couponCode, cart, now })` — same priority/exclusivity/cap logic as bot
- `recordDiscountUsage({ discountId, orderId, customerPhone, amountGiven, channel, ... })` — writes to `discountsUsage/` + atomic `runTransaction` on `stats`
- `getAllDiscounts()` — 30s cached fetch of `Outlet.ref('discounts')`
- `clearDiscountCache()` — called after CRUD operations

## discounts.js — CRUD UI
### Tabs
- **Active**: `enabled && now >= startsAt && (endsAt === 0 || now <= endsAt)`
- **Scheduled**: `enabled && now < startsAt`
- **Expired**: `enabled === false || (endsAt > 0 && now > endsAt)`

### Table columns
Name, Type badge (🌐 Global / 🏷️ Category / ✨ New Customer / 🎟️ Coupon), Value, Time window, Status pill, Actions (edit/delete/toggle)

### "New Discount" modal fields
- Name (required)
- Type: radio — global / category / firstOrder / coupon
- Mode: percent OR fixed (₹)
- Value + Max cap (optional)
- Min subtotal (optional)
- Categories (multi-select) — only if type=category
- Coupon code (auto-suggest) — only if type=coupon
- Starts at / Ends at (date+time, IST)
- Stackable (default false)
- Exclusive group (optional)
- Per-customer limit / Global limit (optional)
- Enabled (default true)

### POS integration
Before `submitWalkinSale` finalizes:
1. Call `evaluateDiscount()` with cart context
2. If cashier entered manual discount → manual wins (`discountSource: "manual"`)
3. If auto-discount wins → apply it, show "Effective discount" indicator
4. Persist `discountSource`, `discountId`, `discountLabel` on order
5. Write `discountsUsage` entry
6. Update `customer.firstOrderDiscountUsed` if firstOrder consumed

## discountsReports.js — Analytics Modal
### KPIs
- Total redemptions (count)
- Total saved (₹)
- Active discounts (count)
- Average discount per order (₹)

### Per-discount breakdown
- Redemption count, total saved, average
- Channel split (whatsapp / pos / manual)

### Recent redemptions
- Last 50 usage records with phone, discount, amount, timestamp

### CSV export
- Per-discount summary with all metrics

## Dependencies
- `firebase.js` — Outlet, ref, get, onValue, set, update, remove, push, runTransaction
- `state.js` — state management
- `ui-utils.js` — showToast, showConfirm
- `utils.js` — haptic, escapeHtml, logAudit
