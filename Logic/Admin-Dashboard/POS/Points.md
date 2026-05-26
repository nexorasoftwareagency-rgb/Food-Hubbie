# POS — Points & Observations

## Receipt Issues
- Data:text/html receipt has **no discount line** — customer won't see discount on printed receipt
- Receipt window has no `window.close()` — user must manually close print tab after printing

## State Persistence Quirks
- `clearCart()` does **not** reset `payMethod` — if cashier changes payment method, it persists across orders
- `clearCart()` **does** reset `discount` to 0 — this is inconsistent with payMethod behavior

## Dead Code
- `updateCartQty` clamps to min 1 — the `if <= 0` check is dead code because items can only be removed via Trash2 icon, never by decrementing below 1

## Race Condition in Stock Decrement
- Stock fetched at checkout start via single `get(Outlet("dishes"))`
- Decremented after the order write
- Small window for overselling if two POS terminals operate on the same outlet simultaneously
- NOT protected by Firebase `transaction()` — uses `update()` with computed value

## No Loading Indicators on Individual Actions
- `addToCart()`, `updateCartQty()` have no loading state
- Fast enough for local state but no visual feedback

## Edit Cart Relies on Cached Dishes
- Edit reads from `dishes[]` state (cached from `onValue` listener)
- If dish was deleted by another admin, edit silently fails with toast: "Original dish no longer available"

## No Customer Registration
- Customer name and phone are free text inputs
- No lookup, no autocomplete, no customer history shown during checkout

## Order Type Limited
- Radio buttons: Dine-in / Takeaway only
- No Delivery option in POS — delivery orders come through the bot, not created via POS
