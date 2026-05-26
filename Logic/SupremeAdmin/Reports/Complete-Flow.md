# Reports — Complete Flow

## User Journey
1. Admin clicks Reports tab → initReports() fires
2. Reads all orders across all businesses/outlets
3. Computes 6 key metrics:
   - Total Revenue, Total Orders, Avg Order Value
   - Net Platform Revenue, Partner Payouts, Take Rate
4. Builds all-time daily revenue line chart
5. Renders Top 10 Outlets table by revenue
6. Admin can:
   a. **View metrics** in summary cards
   b. **View revenue chart** — daily trend line
   c. **Export CSV** — downloads current table as CSV
   d. **Export PDF** — html2pdf.js generates PDF of report content

## Data Flow
/businesses → once('value') → iterateAllOrders() →
  computeMetrics() → updateSummaryCards() →
  buildRevenueChart(dailyData, "reportsChart") →
  computeTopOutlets() → renderTop10Table()
