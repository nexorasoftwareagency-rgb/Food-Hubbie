# Complete Flow: AnalyticsPage

## 1. Page mount
1. User navigates to Analytics from sidebar
2. `AnalyticsPage()` mounts with `loading=true`, `period="week"`, empty arrays
3. `useEffect` runs, attaches 3 `onValue` listeners (`orders`, `riders`, `dishes`)
4. First `orders` snapshot arrives → `setOrders(...)` + `setLoading(false)` → page renders
5. `riders` and `dishes` snapshots populate asynchronously (no loading gate)

## 2. KPI computation
1. `days = 7 | 30 | 90` based on `period`
2. `weekData = aggregateByDay(orders, days)` → 7 day-of-week buckets with current + previous period totals
3. Reduce `weekData` → `totalRev`, `totalOrd`, `prevRev`, `prevOrd`
4. Compute trend %: `((cur - prev) / prev) * 100`
5. Compute `avgValue = totalRev / totalOrd`
6. Find `bestDay` = bucket with max `rev`
7. Count `cancelledCount` from `orders` array
8. Compute `cancelRate` = (cancelled / total orders) * 100

## 3. Chart computation
1. `hourlyData = aggregateByHour(orders)` — 16 hour buckets (8a–11p)
2. `catData = aggregateByCategory(orders, dishes)` — % share per category
3. `topDishes = aggregateByDish(orders, 8)` — top 8 by quantity
4. `topCustomers = aggregateByCustomer(orders, 6)` — top 6 by delivered revenue
5. `topRiders` = sort riders by `deliv` desc, slice 6

## 4. Render
1. Toolbar with period pills + Export button + range label
2. 5 KPI cards in responsive grid (auto-fill, min 180px)
3. Revenue & Orders bar chart (dual Y-axis)
4. vs Previous Period comparison widget
5. Sales by Category pie chart + legend
6. Orders by Hour area chart
7. Rider Performance ranked list with progress bars
8. Top Dishes horizontal bar chart (new in this revision)
9. Top Customers ranked list (new in this revision)

## 5. User interactions
1. **Click period pill** → `setPeriod(p)` → re-runs aggregators (memos recompute via `orders` dep)
2. **Click Export** → builds CSV from `weekData`, downloads as `analytics-{period}-{YYYY-MM-DD}.csv`
3. **Hover bar/pie/area** → recharts tooltip shows value + name
4. **Resize window** → recharts `ResponsiveContainer` re-flows

## 6. Unmount
1. `useEffect` cleanup runs: `off(oref, "value", u1)` + same for rref/dref
2. Listeners detached, no further setState calls

## 7. Edge cases
- **No orders yet** → all KPIs show 0, all charts show empty state ("No sales data yet")
- **No dishes** → `catData` returns empty, pie shows empty state
- **All riders offline** → `topRiders` shows offline status dots
- **Status field missing** → `String(o.status).toLowerCase()` returns "undefined" which doesn't match any branch — order counted in `totalOrd` but not in `totalRev` (safe default)
- **`createdAt` missing** → aggregator skips the order (uses `if (!o.createdAt) return;`)

## 8. Cross-page flows
- **From Dashboard** — Dashboard's "Today's Revenue" is a subset of Analytics' `totalRev` for `period="week"`, first bucket (today)
- **From Orders** — Click on a date in the Revenue chart (future feature) → Orders page filtered to that day
- **From Menu** — Top Dishes chart uses the same `dishes/` node that Menu page writes to
