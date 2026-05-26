# Dashboard — Code Logics

## Initialization
- initDashboard() called on first tab show (from showTab → initMap)
- Attaches real-time listener on /businesses (never detached)

## Real-Time Listener
- Listens on /businesses (entire node)
- On data change: rebuilds all KPIs, charts, and recent activity
- Computes 6 KPI values:
  1. Total Businesses: Object.keys(businesses).length
  2. Total Outlets: Sum of Object.keys(businesses[bid].outlets || {}).length across all businesses
  3. Orders Today: Count orders where order.timestamp is within last 24 hours
  4. Revenue Today: Sum of order.total where order.timestamp is within last 24 hours
  5. Total Users: Read from cached usersData (set by initUsers listener)
  6. Total Riders: Read from cached ridersData (set by initRiders listener)

## Chart.js Charts

### buildRevenueChart(dailyRevenue, canvasId)
- Parameters: dailyRevenue (object of date→total), canvasId (default "revenueChart")
- Line chart with 14-day window
- X-axis: dates (MM/DD), Y-axis: revenue (₹)
- Gradient fill under line
- Destroys previous instance via global revenueChartInstance

### buildOrdersChart(statusCounts)
- Doughnut chart
- 7 segments: pending, confirmed, preparing, out_for_delivery, delivered, cancelled, rejected
- Colors: #F59E0B, #3B82F6, #8B5CF6, #F97316, #22C55E, #EF4444, #6B7280
- Shows count and percentage in tooltip

## Recent Activity
- Iterates all orders across all businesses/outlets
- Sorts by timestamp descending
- Renders last 10 activities: "Order #{orderId} - {status} by {customerName}"
- Uses timeAgo() for relative timestamps

## Data Aggregation
- Daily revenue: Iterates all orders, groups by date (YYYY-MM-DD from timestamp), sums totals
- Status counts: Iterates all orders, counts per status value
- Activity feed: Flattens all orders into chronological list, takes top 10

## Dependencies
- Chart.js 4.4.7 (CDN)
- Global variables: revenueChartInstance, ordersChartInstance, usersData, ridersData
- Relies on initUsers and initRiders being called first (cross-tab data sharing via globals)
