# Reconciliation Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Financial Recon" tab
2. Tab click handler: set title "Partner Financial Control"
3. loadReconciliations() called:
   ├─ Read filter values (from/to date, outlet, status)
   ├─ db.ref('businesses').once('value', (snap) => {
   │   ├─ Iterate all businesses → outlets
   │   ├─ Collect settlement records into globalReconciliations[]
   │   ├─ Apply filters:
   │   │   ├─ Outlet filter (if not "all")
   │   │   ├─ Status filter (PENDING/SETTLED/all)
   │   │   └─ Date range filter (from/to)
   │   ├─ updateReconKPIs(filtered): compute 4 KPI cards
   │   ├─ renderReconciliationTable(filtered): build table rows
   │   ├─ Populate #filterOutlet dropdown
   │   └─ lucide.createIcons()
   │   })
```

## Settle Transaction Flow
```
1. Admin finds PENDING row
2. Taps "Settle" button
3. SweetAlert2 shows:
   ├─ "Process Settlement?"
   ├─ Order: ORD-20250101-0001
   ├─ Partner: Business Name — Outlet Name
   ├─ Net Payout: ₹375
   └─ [Cancel] [Confirm Settlement]
4. On confirm:
   ├─ ref('wallet').transaction(current => (current||0) + netPayout)
   ├─ ref('ledger').push({ type:"settlement", amount:netPayout, orderId, timestamp })
   ├─ ref('settlements/{id}').update({ status:"SETTLED", settledAt:Date.now(), settledBy:uid })
   ├─ logAdminAction('SETTLEMENT_PROCESSED', { orderId, amount:netPayout })
   ├─ showToast("Settlement completed")
   └─ loadReconciliations() to refresh
```

## Export Flow
```
1. Admin taps "Export Sheet"
2. If no data → showToast("No data to export")
3. Build CSV header row
4. For each row: apply safeCSV() to orderId, partner, amounts, status
5. Create Blob with CSV content
6. Create download link: URL.createObjectURL(blob)
7. Trigger click → download reconciliation_export_YYYY-MM-DD.csv
```
