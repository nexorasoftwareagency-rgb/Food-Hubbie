# Points / Gotchas: AnalyticsPage

## Date handling
- **Period window is rolling, not calendar** — "last 7 days" means `Date.now() - 7*86400000` to `Date.now()`. A user opening the page on Monday morning sees a different window than one who opened on Sunday night.
- **Timezone is browser-local** — `new Date(o.createdAt).getDay()` uses the browser's timezone. If admin is in IST and Firebase timestamps are UTC, day-of-week bucketing can shift at the boundary. For a multi-region chain, this is a known limitation.
- **No DST handling** — `days * 86400000` doesn't account for DST transitions; off by 1 hour twice a year. Acceptable for daily aggregates.

## Status string normalization
- Always call `String(o.status).toLowerCase()` before comparing — Firebase can return mixed-case from older clients.
- Match `"cancelled"` AND `"canceled"` (UK spelling) — both are in the wild.
- Future-proof: use a status enum from `Logic/Shared/status-enum.md` if one is created.

## Cart shape variation
Orders can have either:
- `o.cart` (array) — new clients
- `o.items` (object map) — legacy clients

The aggregator handles both: `Array.isArray(o.cart) ? o.cart : Object.values(o.items || {})`. But beware:
- `Object.values()` on a Firebase snapshot may include `null` entries if items were deleted — always guard with `if (!i) return;`

## Customer identification
- `userId` is preferred, fallback to `uid`, then `phone`, then "Anonymous".
- Anonymous orders (no `userId`/`uid`/`phone`) all get bucketed into the same "Anonymous" entry — could artificially boost that bucket. Consider filtering anonymous out of the top-customers list if it dominates.

## Performance
- For outlets with >5k orders, the page recomputes all `useMemo` on every orders snapshot. Each aggregator is O(N) over orders × cart length. Keep the page tab closed when not in use to avoid unnecessary recomputation.
- `setLoading(false)` happens on the first orders snapshot, not on dishes/riders — UI shows earlier even if menu/rider data is still loading.

## Cancellation rate
- Counts `cancelled | canceled` case-insensitively
- Denominator is **all** orders (including delivered) — so a 10% cancel rate means 10% of all placed orders were cancelled, not 10% of in-flight ones. Document this in the UI tooltip.

## Best Day quirk
- "Best Day" is **day of week** (e.g. "Sunday"), not calendar date. With only 7 buckets and 7-day period, each bucket has ~1 data point — so "Best Day" with a 7-day window is essentially "which day was the most recent Sunday's revenue". Switch to a longer period for more meaningful "Best Day".

## Common bugs to avoid
- Don't pass `Math.abs(Number(revTrend))` to a component that expects a signed number — sign indicates direction.
- Don't forget `key={c.uid}` on the customer row — `uid` is stable; `idx` would cause re-renders on resort.
- CSV export uses `weekData` only (current period) — doesn't include previous period. Add a "with comparison" export option later.
