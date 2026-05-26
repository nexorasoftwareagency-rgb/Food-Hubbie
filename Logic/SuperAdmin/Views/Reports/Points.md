# Reports Tab — Important Points

1. **Chart.js cleanup**: `revenueChartInstance.destroy()` must be called before re-creating chart to prevent canvas leaks
2. **14-day window**: Revenue chart is last 14 complete days (not including today)
3. **CSV export**: Uses same `safeCSV()` pattern as other export functions
4. **PDF export dependency**: Requires `html2pdf.bundle.min.js` CDN — if CDN fails, PDF export errors
5. **Full business scan**: `loadReports()` reads the entire `businesses` tree — expensive for large ecosystems
6. **No real-time**: Uses `once('value')` — manual refresh
7. **Shared function**: Analytics tab calls the same `loadReports()` — data is cached in globals
8. **Commission calculation**: Platform commission may be pre-calculated on order or computed as flat 10%
