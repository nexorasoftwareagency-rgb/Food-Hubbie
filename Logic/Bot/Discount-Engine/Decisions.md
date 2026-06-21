# Decisions: Bot Discount Engine

## Why a separate file from the Admin evaluator?
The Admin uses ES modules (`import/export`) via Vite. The Bot uses CommonJS (`require`). Same algorithm, different module systems. `discount-engine.js` (bot) mirrors `discount-evaluator.js` (admin) but with `firebase-admin` imports.

## 30-second cache — why not longer?
- Longer cache = stale discounts (admin just activated a new one, customer orders immediately)
- Shorter cache = too many Firebase reads on rush hours
- 30s is the sweet spot: 2 reads/min per bot process, ~2,880/day vs 50K Spark limit

## Feature flag at `${OUTLET}/discounts/featureEnabled`
- Allows instant kill-switch without code deploy
- Default: `true` (null/undefined treated as enabled)
- Admin UI hides the Discounts tab when flag is off

## Why `runTransaction` for stats?
Two admins can simultaneously complete orders that use the same discount. Without `transaction`, one `usedCount++` could be lost. `runTransaction` guarantees atomic increment.

## Manual override wins in POS
The cashier's manual discount always overrides the auto-discount. This is a deliberate UX choice: the cashier is the authority at the point of sale. Auto-discount is logged but not applied when manual is present.

## firstOrder check timing
The bot's `customers/{phone}` is created AFTER order placement (`bot/index.js:1882`). So eligibility is: "the customer record doesn't exist at evaluation time." After order succeeds, write the record with `firstOrderDiscountUsed` to prevent reuse.

## Coupon code case-insensitive
Customer types "FESTIVE5" or "festive5" — both match. Stored as-typed in the discount definition. Compared via `toLowerCase()`.
