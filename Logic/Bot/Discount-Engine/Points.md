# Points / Gotchas: Bot Discount Engine

## Critical
- **`user.discount` was dead code before v4.14.8** — referenced at `bot/index.js:1850` but never assigned. Online orders always had zero discount. The AWAIT_COUPON state + `evaluateAndApplyDiscount()` now populate it.
- **Bot creates `customers/{phone}` AFTER order** — firstOrder check must happen BEFORE `processOrderPlacement`. Use `!await getData(customers/{phone})` to detect new customers.
- **`botUsers/{jid}` vs `customers/{phone}`** — `saveUserProfile` writes to `botUsers/{jid}`. Customer eligibility uses `customers/{phone}`. These are separate nodes.

## Performance
- **30s cache** prevents Firebase read flood. On a 100-order/min rush: 2 reads/min vs 100 reads/min without cache.
- **`runTransaction` for stats** — prevents lost increments under concurrent orders. Same pattern as `pos.js:623, 657`.

## Edge Cases
- **Subtotal ≤ 0** — evaluator returns `null` immediately (no discount on zero/negative)
- **Manual override** — POS cashier's manual discount always wins; auto-discount is logged but not applied
- **Coupon code case** — `toLowerCase()` comparison; stored as-typed
- **Feature flag off** — `discounts/featureEnabled: false` makes evaluator return `null` for everything
- **Bot offline during order** — evaluator try/catch returns empty cache → no discount applied (safe default)
- **firstOrder abuse** — only one welcome discount per customer; tracked in `customer.firstOrderDiscountUsed`
- **Concurrent discount edits** — eventual consistency; the evaluator reads latest at evaluation time

## Status String Normalization
Always `String(o.status).toLowerCase()` before comparing — Firebase can return mixed-case from older clients. Match both `"cancelled"` and `"canceled"`.

## Related docs
- `Logic/Bot/Discount-Engine/Code-Logics.md` — full implementation
- `Logic/Admin-Dashboard/Discounts/Points.md` — Admin-side gotchas
