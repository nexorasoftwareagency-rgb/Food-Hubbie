# Analytics Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Global Analytics" tab
2. Tab click handler: set title "Global Analytics", subtitle "Platform-wide metrics"
3. loadReports() called (shared with Reports tab):
   ├─ db.ref('businesses').once('value')
   ├─ Aggregate all orders across all outlets
   ├─ Compute total revenue, order count, avg value
   ├─ Update KPI cards: #analyticsTotalRevenue, etc.
   └─ lucide.createIcons()
```

## User Interactions
| Action | Result |
|---|---|
| Tap "Refresh Data" | Re-call loadReports() |
| View metrics | Read-only KPI cards |
