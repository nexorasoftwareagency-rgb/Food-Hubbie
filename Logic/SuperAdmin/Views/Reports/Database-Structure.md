# Reports Tab — Database Structure

## Order (aggregated)
`businesses/{bid}/outlets/{oid}/orders/{orderId}`
Used fields: `totalAmount`, `commission`, `status`, `createdAt`, `outletName`, `businessName`

## Chart Data (computed)
```javascript
// 14-day daily revenue
dailyData = {
  "2025-01-01": 45000,
  "2025-01-02": 52000,
  ...
}
```

## KPI Formulas
| KPI | Formula |
|---|---|
| Total Orders | Count of all orders (all statuses) |
| Total Revenue | `sum(order.totalAmount)` |
| Platform Commissions | `sum(order.totalAmount * 0.10)` or pre-calculated commission |
| Avg Order Value | `sum(totalAmount) / count(orders)` |

## Outlet Leaderboard
| Rank | Metric | Source |
|---|---|---|
| 1-N | Outlet name | `outlet.name` |
| | Order count | Count of orders |
| | Revenue | Sum of totalAmount |
| | Revenue share % | `outletRevenue / totalRevenue * 100` |
