# SuperAdmin — Financial Reconciliation

## Overview
Manual settlement processing center — loads settlements from all outlets, applies filters, processes payouts.

## Data Flow
```
loadReconciliations():
  db.ref('businesses').once('value')
  → Extract all settlements into globalReconciliations[]
  → Apply filters (date, outlet, status)
  → updateReconKPIs()
  → renderReconciliationTable()
```

## Settlement Record Lifecycle
```
ORDER COMPLETED → Settlement created with status PENDING
  → Admin reviews in Financial Recon tab
  → Admin taps "Settle"
  → Wallet + Ledger updated
  → Settlement status → SETTLED
```

## Settle Transaction
```javascript
settleTransaction(id, outletPath):
  1. Read settlement record
  2. SweetAlert2 confirm dialog:
     ├─ Order: {orderId}
     ├─ Partner: {businessName} — {outletName}
     ├─ Net Payout: ₹{netPayout}
     └─ [Cancel] [Confirm]
  3. On confirm:
     └─ Atomic update:
         ├─ transaction on businesses/{bid}/outlets/{oid}/wallet
         ├─ push to businesses/{bid}/outlets/{oid}/ledger/{txId}
         ├─ update settlement: status="SETTLED", settledAt, settledBy
         └─ logAdminAction('SETTLEMENT_PROCESSED')
```

## Filter System
| Filter | Type | Default |
|---|---|---|
| Date From | date input | none |
| Date To | date input | none |
| Outlet | select (populated dynamically) | All |
| Status | select | PENDING |

## Global KPIs
| KPI | Source |
|---|---|
| Total Volume | Sum of all `orderTotal` |
| Platform Commissions | Sum of all `commission` |
| Pending Settlements | Sum of `netPayout` where PENDING |
| Total Settled | Sum of `netPayout` where SETTLED |

## CSV Export
```javascript
exportReconciliationReport():
  // Headers: Ref ID, Date, Partner, Order Total, Commission, Rider Payout, Net Payout, Status
  // safeCSV() on all values
  // Download as reconciliation_export_YYYY-MM-DD.csv
```

## Edge Cases
- **No settlements** → KPIs show 0, table shows empty state
- **All settled** → Pending KPI = 0, "All caught up" message
- **Wallet transaction race condition**: `transaction()` prevents concurrent payout conflicts
- **Settlement with missing outlet**: Data may be orphaned if outlet was deleted — caught by null check
- **Export with filters**: Exports the currently filtered data (not all data)
