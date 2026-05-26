# Reports Tab — Code Logics

## Purpose
Ecosystem reports — aggregated KPIs, outlet leaderboards, revenue chart, and multi-format export.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadReports()` | Tab load | Aggregate orders across all outlets, compute KPIs |
| `renderRevenueChart(dailyData)` | Data ready | Chart.js line chart (14 days) |
| `exportReport(format)` | Export button | CSV, Excel, or PDF export |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | Aggregate all orders |
| `system/auditLogs` | `once('value')` | Audit log for reports |

## KPI Cards
| Metric | Computation |
|---|---|
| Total Orders | Count of all orders |
| Total Revenue | Sum of `totalAmount` |
| Platform Commissions | Sum of commission on orders |
| Avg Order Value | Revenue / Orders |

## Outlet Leaderboard
```
Orders by Outlet:
  ├─ Sort outlets by order count (descending)
  ├─ Show: ranking, outlet name, order count, revenue share
  └─ Optional: bar visualization
```

## Revenue Chart
```javascript
renderRevenueChart(dailyData):
  ├─ Group orders by day (last 14 days)
  ├─ Chart.js line chart
  ├─ X-axis: dates
  ├─ Y-axis: revenue (₹)
  ├─ Dataset: daily revenue
  └─ Canvas element: #revenueChart
```

## Export Formats
| Format | Library | Action |
|---|---|---|
| CSV | Built-in (Blob) | Download CSV file |
| Excel | Built-in (CSV with .xls rename) | Download .xls file |
| PDF | html2pdf.js | Generate PDF from report HTML |

## Edge Cases
- **No orders** → KPIs show 0, chart empty, leaderboard empty
- **Single day of data** → Chart shows one point
- **Export with no data** → "No data to export" toast
- **PDF generation failure** → Catch error, show toast
- **Chart.js instance reuse** → `revenueChartInstance.destroy()` before creating new chart
