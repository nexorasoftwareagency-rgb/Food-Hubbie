# Code-Logics: AnalyticsPage

**Location**: `admin-dashboard/src/App.jsx:2852` (page), `:2815-2880` (aggregators)

## Real-time Firebase subscriptions
```js
useEffect(() => {
  const oref = Outlet("orders");
  const rref = ref(db, "riders");
  const dref = Outlet("dishes");
  const u1 = onValue(oref, snap => { setOrders(...); setLoading(false); });
  const u2 = onValue(rref, snap => { ...normalizeRider... });
  const u3 = onValue(dref, snap => setDishes(snap.val() || {}));
  return () => { off(...); };
}, []);
```
Three `onValue` listeners — `orders` (scoped to outlet), `riders` (global), `dishes` (scoped to outlet). Cleaned up on unmount.

## State
- `period` — `"week"` | `"month"` | `"quarter"` — controls `days` (7 / 30 / 90)
- `orders` — array of order objects, all statuses
- `riders` — array of normalized riders (uses `normalizeRider`)
- `dishes` — map for category lookup in `aggregateByCategory`
- `loading` — true until first orders snapshot

## Aggregator functions (module-level, lines 2815-2880)
- `aggregateByDay(orders, daysBack)` — buckets by day-of-week (Sun–Sat), splits into current vs previous period
- `aggregateByHour(orders)` — buckets by hour 8a–11p (16 buckets)
- `aggregateByCategory(orders, dishes)` — % share by category, joined via `dish.id | dish.menuItemId`
- `aggregateByDish(orders, topN=8)` — top N by quantity sold, includes `qty` + `revenue`
- `aggregateByCustomer(orders, topN=6)` — top N by revenue (delivered orders only), keyed by `userId | uid | phone`

## Computed Values
- `totalRev` / `totalOrd` — sum of current period buckets (delivered only counts toward rev)
- `prevRev` / `prevOrd` — sum of previous period buckets (trend baseline)
- `revTrend` / `ordTrend` / `avgTrend` — `((current - prev) / prev) * 100` percentage, fallback "100.0" if prev=0
- `avgValue` — `totalRev / totalOrd`
- `bestDay` — day with max revenue
- `cancelledCount` — orders with `status === "cancelled" | "canceled"` (case-insensitive)
- `cancelRate` — `(cancelledCount / totalOrders) * 100`
- `topRiders` — sorted by `deliv` desc, top 6
- `maxDeliv` — for rider progress bar normalization

## Renders
1. **Toolbar** — period pills (week/month/quarter), `rangeLabel` (e.g. "15 Mar — 22 Mar, 2026"), `Export` button → CSV download
2. **5 KPI cards** — Revenue ▲▼%, Orders ▲▼%, Avg Order Value ▲▼%, Best Day (day + rev + ord), **Cancellation Rate** (X-circle icon, red, shows "N of M orders")
3. **Revenue & Orders bar chart** — dual-axis bar (revenue ₹k left, order count right)
4. **vs Previous Period** — side-by-side big numbers with arrows
5. **Sales by Category** — pie chart + legend (% share, 6 categories max)
6. **Orders by Hour** — area chart, 8a–11p
7. **Rider Performance** — avatar + name + vehicle + status dot, deliveries count, earnings, optional star rating, progress bar
8. **Top Dishes (by quantity sold)** — horizontal bar chart, top 8
9. **Top Customers** — ranked list (1-6) with avatar, name, order count, phone, total revenue

## Filters applied
- `aggregateByDay` filters by `o.createdAt >= start` (current period) or `prevStart` (previous period)
- `aggregateByHour` filters `h >= 8 && h <= 23` (skips 12am–7am)
- Revenue counts only orders with `status.toLowerCase() === "delivered"`
- Cancellation counts `cancelled` or `canceled` (handles UK/US spelling)
