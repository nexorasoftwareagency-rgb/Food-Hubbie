# Discount Engine (bot/discount-engine.js) — Code Logics

## Overview
Bot-side discount evaluator. Mirrors Admin's `discount-evaluator.js` but uses `firebase-admin` (bypasses RTDB rules). Called inside `processOrderPlacement` to auto-apply the best eligible discount before computing `total`.

## Dependencies
- `./firebase.js` — `db` (firebase-admin instance), `getData`
- No external libraries

## Exports
| Function | Signature | Returns |
|---|---|---|
| `evaluateDiscount` | `({ OUTLET, customer, subtotal, couponCode, cart, now })` | `Promise<{ discount, allApplied, amount, label, source } \| null>` |
| `validateCouponCode` | `(OUTLET, code)` | `Promise<{ id, ...discount } \| null>` |
| `recordDiscountUsage` | `({ OUTLET, discountId, orderId, customerPhone, amountGiven, channel, discountLabel, discountSource })` | `Promise<void>` |
| `formatDiscountLine` | `(discount)` | `string` (e.g. `"🎁 Discount (Festive 5%): -₹50\n"`) |
| `getAllDiscounts` | `(OUTLET)` | `Promise<Object>` (all discount defs) |

## Cache
```js
const CACHE_TTL_MS = 30_000;
const _cache = { data: null, fetchedAt: 0, outlet: null };
```
- 30-second in-memory cache per outlet
- Prevents 100-order rush from burning 50K+ Firebase reads/day (Spark plan)
- Cache invalidated on outlet switch or TTL expiry

## evaluateDiscount — Full Logic
1. **Guard**: `subtotal <= 0` → return `null`
2. **Feature flag**: reads `${OUTLET}/discounts/featureEnabled` — if `false`, return `null`
3. **Fetch all**: `getAllDiscounts(OUTLET)` (cached)
4. **Filter candidates**: `enabled !== false`, within time window (`startsAt`/`endsAt`), meets `minSubtotal`, under `globalLimit`
5. **Filter applicable** by type:
   - `global` → always applicable
   - `firstOrder` → `!customer?.firstOrderDiscountUsed`
   - `category` → `cartHasCategory(cart, d.categoryIds)`
   - `coupon` → `couponCode` matches (case-insensitive)
6. **Group-aware exclusivity**: group by `exclusiveGroup` (or `__none__`), pick best per group
7. **Choose winner**: exclusive discounts win over stackable; if all stackable, sum them
8. **Apply caps**: `maxCap` per discount, never exceed subtotal
9. **Return**: `{ discount: primary, allApplied, amount, label, source }`

## Priority Order
```js
const _priority = { firstOrder: 4, coupon: 3, global: 2, category: 1 };
```
Within same priority, highest ₹ amount wins.

## Source Strings
- `coupon:${couponCode}` — coupon-type discount
- `firstOrder` — new customer discount
- `auto:${type}` — global or category auto-discount

## recordDiscountUsage
1. Push to `${OUTLET}/discountsUsage/{usageId}` with full context
2. `runTransaction` on `${OUTLET}/discounts/${discountId}/stats`:
   - `usedCount++`
   - `totalDiscountGiven += amount`
   - `lastUsedAt = Date.now()`
3. Best-effort: catches errors, logs warning, never throws

## formatDiscountLine
```js
function formatDiscountLine(discount) {
    if (!discount || !discount.discount) return '';
    const label = discount.discount.name ? ` (${discount.discount.name})` : '';
    return `🎁 Discount${label}: -₹${Number(discount.amount).toFixed(0)}\n`;
}
```
Used in 5 invoice spots in `bot/index.js` (lines 526, 1110, 1176, 1249, 1942).

## Integration Points
- **Bot state machine**: `AWAIT_COUPON` step → `validateCouponCode()` → store on `user.couponCode`
- **processOrderPlacement**: calls `evaluateDiscount()` after subtotal, before total computation
- **Bot customer record**: after order success, writes `firstOrderDiscountUsed: Date.now()` if first-order consumed
- **Admin POS**: `discount-evaluator.js` (shared logic, same algorithm)
