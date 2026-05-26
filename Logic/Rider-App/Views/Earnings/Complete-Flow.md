# Earnings View — Complete Flow

## Page Load Sequence
```
1. Rider navigates to "Reports" from sidebar
2. window.showEarnings() called
3. Read riders/{uid}/ledger (once, all entries)
4. Read riders/{uid}/wallet (once)
5. Process data:
   a. Calculate today's earnings (sum where timestamp is today)
   b. Calculate cash to settle (sum of cashCollected not yet settled)
   c. Build weekly chart data (last 7 days grouped by day)
   d. Build shop breakdown (grouped by outletId)
6. Render:
   ├─ Today's hero amount
   ├─ Cash to settle section
   ├─ Weekly bar chart
   ├─ Period tabs (Today active)
   └─ Shop breakdown list
```

## Period Change Flow
```
1. Rider taps "This Week" tab
2. Recalculate sum of earnings from start of week to now
3. Update hero amount display
4. No change to chart (already weekly)
5. Shop breakdown unchanged (always all-time)
```

## Interaction Flow
```
1. Earnings hero: Shows period earnings + delivery count
2. Cash to settle: Tap → navigate to Ledger for settlement
3. Weekly chart: Read-only visualization
4. Shop breakdown: Tap any shop → show shop detail popover
   ├─ Outlet name
   ├─ Total deliveries
   ├─ Total earnings
   └─ Average per delivery
```
