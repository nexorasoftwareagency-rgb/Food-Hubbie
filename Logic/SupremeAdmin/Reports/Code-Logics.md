# Reports — Code Logics

## Initialization
- initReports() reads all orders from all businesses/outlets
- Computes report metrics and renders charts/tables

## Metrics Computed
1. **Total Revenue**: Sum of all order totals across all businesses
2. **Total Orders**: Count of all orders
3. **Avg Order Value**: Total Revenue / Total Orders
4. **Net Platform Revenue**: Sum of (order total - commission - fixed fee) for applicable orders
5. **Partner Payouts**: Sum of commissions and fees
6. **Take Rate**: (Net Platform Revenue / Total Revenue) * 100

## Revenue Chart
- buildRevenueChart() on canvas reportsChart
- Line chart with all-time daily revenue
- X-axis: dates, Y-axis: revenue in ₹
- Same pattern as Dashboard chart but all-time (not limited to 14 days)

## Top 10 Outlets
- Aggregates revenue per outlet across all orders
- Sorts by total revenue descending
- Shows top 10: Rank, Outlet Name, Business, Total Revenue, Orders Count

## CSV Export
- Reads rendered table DOM (top 10 outlets + summary)
- Generates CSV with BOM
- Triggers download

## PDF Export
- Uses html2pdf.js library
- Captures entire reports tab HTML content
- Generates PDF and triggers download

## Orphaned Canvas
- HTML has canvas id="dailyRevenueTrendChart" at line 405
- No JS code writes to this canvas
- It's a duplicate/redundant element (reportsChart serves same purpose)

## Extra HTML Tag
- Extra closing </div> at line 414 closes reportsContent early
- This places the final reportsChart pro-card OUTSIDE reportsContent
- Affects PDF export scope (may miss elements)
