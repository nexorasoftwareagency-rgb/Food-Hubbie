# Reports Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Ecosystem Reports" tab
2. loadReports() called:
   ├─ db.ref('businesses').once('value', (snap) => {
   │   ├─ Aggregate all orders
   │   ├─ Compute KPIs: total orders, revenue, commissions, avg value
   │   ├─ Build outlet leaderboard
   │   ├─ Compute daily revenue (14 days)
   │   ├─ Render KPI cards
   │   ├─ Render outlet leaderboard table
   │   ├─ If revenueChartInstance exists → destroy()
   │   ├─ renderRevenueChart(dailyData): Chart.js line chart
   │   └─ lucide.createIcons()
   │   })
```

## Export Flow
```
1. Admin taps export format button (CSV / Excel / PDF)
2. exportReport(format):
   ├─ If CSV:
   │   ├─ Build CSV rows from current data
   │   ├─ safeCSV() on all values
   │   └─ Download reports_export_YYYY-MM-DD.csv
   ├─ If Excel:
   │   ├─ Same CSV content with .xls extension
   │   └─ Download reports_export_YYYY-MM-DD.xls
   ├─ If PDF:
   │   ├─ Clone report HTML content
   │   ├─ html2pdf().from(element).save(filename)
   │   └─ On error → showToast("PDF generation failed")
```
