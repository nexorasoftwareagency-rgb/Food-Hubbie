# OrdersPage Decisions

## Date Range Filter
- Uses native `<input type="date">` — no external date library required
- Compares ISO date strings (YYYY-MM-DD) against `createdAt`
- Simple, lightweight, no moment/date-fns dependency

## Rider Filtering
- `activeRiders` filters to `"Online"` and `"On Delivery"` only
- Offline riders are hidden from assignment dropdown
- Prevents assigning orders to unavailable riders

## Payment Status Automation
- Payment status auto-set to `"Paid"` on delivery
- No manual payment confirmation step needed
- Assumes delivery = payment received (COD or already paid online)

## Status Dropdown
- Shows all possible statuses (not just next step in SEQ)
- Provides flexibility for manual override
- Validation still enforces SEQ flow in `updateStatus`

## Modal Pricing Card
- Uses dark card (`#0f172a`) for pricing section
- Visual contrast draws attention to financial summary
- Shows subtotal, discount, deliveryFee, total

## CSV Export
- Uses `orderItemsText()` for human-readable item list
- Makes spreadsheet data useful without cross-referencing
- Columns optimized for reporting: orderId, customer, phone, items, itemCount, total, paymentMethod, paymentStatus, status, rider, createdAt
