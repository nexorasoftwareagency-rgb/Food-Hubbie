# Complete Flow: Admin Discounts Module

## 1. Admin creates discount
1. Click "➕ New Discount" in Discounts tab
2. Fill modal: name, type, value, time window, settings
3. Click "Save & Activate" → `push()` to `Outlet.ref('discounts')`
4. `clearDiscountCache()` → next order picks up new discount

## 2. Customer orders (bot)
1. Bot reaches AWAIT_COUPON step
2. Customer enters coupon code (or skips)
3. `evaluateDiscount()` runs in `processOrderPlacement`
4. Best discount applied → `user.discount = amount`
5. `total = subtotal + deliveryFee - user.discount`
6. Order persisted with `discountSource`, `discountId`, `discountLabel`
7. `recordDiscountUsage()` writes to `discountsUsage/` + bumps `stats`

## 3. Customer orders (POS)
1. Cashier adds items to cart
2. "Effective discount" indicator shows auto-discount
3. Cashier can override with manual discount (manual wins)
4. `submitWalkinSale` calls `evaluateDiscount()` or uses manual
5. Order persisted with `discountSource: "auto:..."` or `"manual"`
6. `recordDiscountUsage()` writes to `discountsUsage/`

## 4. Admin views reports
1. Click "📊 Reports" in Discounts tab
2. `discountsReports.js` opens modal
3. Fetches all `discountsUsage/` records
4. Computes KPIs, per-discount breakdown, channel split
5. Shows last 50 redemptions
6. "⬇ Export CSV" downloads summary

## 5. Admin toggles/disables discount
1. Click toggle in discounts table
2. `update(Outlet.ref('discounts/{id}/enabled'), false)`
3. `clearDiscountCache()` → next order won't apply this discount

## 6. Cross-page flows
- **Bot** — discount engine reads same `discounts/` node
- **POS** — discount evaluator reads same node
- **Promotions** — coupon codes generated per-recipient can be redeemed in checkout
- **Orders** — `discountSource` pill visible in orders table
