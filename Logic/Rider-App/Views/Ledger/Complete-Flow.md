# Ledger View — Complete Flow

## Page Load Sequence
```
1. Rider navigates to "Ledger" from sidebar
2. window.showLedger() called
3. Parallel reads:
   ├─ riders/{uid}/wallet (once)
   ├─ riders/{uid}/ledger (once, last 50)
   └─ settlements/{uid} (once)
4. Render wallet hero with balance
5. Calculate today's earning from ledger entries
6. Calculate cash to settle
7. Render transaction list (last 10, "View All" for full)
8. Show/hide settlement section based on cashToSettle > 0
```

## Settlement Request Flow
```
1. Rider taps "Request Settlement"
2. Open #settlementModal showing:
   ├─ Cash to settle amount
   ├─ Settlement history list
   └─ "Request Settlement" button
3. Rider taps "Request Settlement"
4. Firebase push to settlements/{uid}/{pushId}:
   { amount, status: "pending", requestedAt: Date.now() }
5. Show success toast "Settlement requested"
6. Update cash to settle display
7. Add entry to settlement history
```

## Transaction View Flow
```
1. Rider taps "View All"
2. Load full ledger (all entries)
3. Render in scrollable list with type icons
4. Each entry shows: date, type, description, amount (+/-)
5. Amount coloring: green for positive, red for negative
6. No further pagination (all loaded)
```
