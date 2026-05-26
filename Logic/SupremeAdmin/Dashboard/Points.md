# Dashboard — Points

## Key Implementation Details
- Globals revenueChartInstance and ordersChartInstance used only for Chart.js destroy
- User/riders counts depend on initUsers/initRiders having been called (cross-tab dependency)
- No loading indicator between Firebase fetch and render
- 14-day revenue chart X-axis may overlap if many days have zero revenue
- Doughnut chart shows all 7 statuses even if count is 0

## Gotchas
- Entire /businesses node downloaded on every change (expensive at scale)
- KPI cards show stale user/rider counts until those tabs are first visited
- No error state — if Firebase read fails, dashboard stays blank
- Activity feed shows orders from all time (not just today), sorted by newest

## Data Freshness
- Businesses/outlets/orders: Real-time via listener
- Users count: Updated only when Users tab listener fires
- Riders count: Updated only when Riders tab listener fires

## Performance Notes
- O(n) iteration over all businesses, outlets, and orders for every KPI refresh
- With large datasets, dashboard may lag on each data change
- No virtualization or incremental rendering
