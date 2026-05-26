# Dashboard Tab — Complete Flow

## Page Load Sequence
```
1. Admin logs in → checkAuth() → applyRBACRestrictions → "dashboard" tab active by default
2. Tab click handler: set title "Network Control", subtitle "Real-time platform telemetry"
3. initStats() called:
   ├─ db.ref('businesses').on('value', (snap) => {
   │   ├─ Clear allBusinessesList
   │   ├─ For each business:
   │   │   ├─ Increment #countBusinesses
   │   │   ├─ Count outlets → add to #countOutlets
   │   │   ├─ Iterate orders → filter today's → add to #countOrdersToday
   │   │   └─ Build heatmap data matrix
   │   ├─ renderDashboardSparklines(): creates 3 SVG sparklines
   │   ├─ renderOrderHeatmap(): builds 7×24 table
   │   ├─ renderBusinessList(): builds business registry table
   │   ├─ Update #lastSyncTime
   │   └─ lucide.createIcons()
   │   })
   └─ db.ref('users').once('value', (snap) => {
       └─ #countCustomers.textContent = Object.keys(val).length
       })

4. Dashboard visible with live-updating data
```

## Admin Interactions
| Action | Result |
|---|---|
| Hover on business row | Row highlight |
| Tap View on business | Navigate to Outlets tab filtered by business |
| Tap Provision Node | Navigate to Onboarding tab |
| Tap Reload button | `location.reload()` (full page) |
| Hover on sparkline | Tooltip with value (if implemented) |
