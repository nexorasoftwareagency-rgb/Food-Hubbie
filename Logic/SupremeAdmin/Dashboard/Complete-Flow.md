# Dashboard — Complete Flow

## User Journey
1. Admin authenticates → showTab("dashboard") called
2. initDashboard() fires → attaches listener on /businesses
3. Listener fires → computeAllMetrics() runs:
   a. Count businesses (Object.keys)
   b. Count outlets (nested sum)
   c. Filter orders by today's timestamp range
   d. Sum today's revenue
   e. Read user/riders counts from globals
4. KPI cards updated with new values
5. buildRevenueChart() aggregates last 14 days of revenue
6. buildOrdersChart() counts orders by status
7. Recent activity rendered (last 10 orders by timestamp)
8. Any data change → entire flow repeats (listener never detached)

## Data Flow
/businesses (RTDB) → on() listener → computeAllMetrics() → 
  updateKPI() + buildRevenueChart() + buildOrdersChart() + renderActivity()

## Error Handling
- No explicit error handling
- If listener fails to attach, dashboard remains empty
- If individual KPI computation fails (e.g., NaN total), value shows as-is
