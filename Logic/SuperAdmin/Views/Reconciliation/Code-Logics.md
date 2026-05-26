# Reconciliation Tab — Code Logics

## Purpose
Financial reconciliation center — manual settlement and payout processing across all outlets.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadReconciliations()` | Tab load / refresh | Load settlements from all businesses/outlets, apply filters |
| `renderReconciliationTable(data)` | Data ready | Build settlement table |
| `updateReconKPIs(data)` | Data ready | Update financial KPI cards |
| `settleTransaction(id, outletPath)` | Settle button | Process settlement via SweetAlert2 |
| `exportReconciliationReport()` | Export button | CSV export |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `businesses/{bid}/outlets/{oid}/settlements` | `once('value')` | Settlement records |
| `businesses/{bid}` | `once('value')` | Business name lookup |
| `businesses/{bid}/outlets/{oid}` | `once('value')` | Outlet name lookup |
| `businesses/{bid}/outlets/{oid}/wallet` | `transaction` | Wallet update on settle |
| `businesses/{bid}/outlets/{oid}/ledger/{txId}` | `push()` | Ledger entry on settle |

## Settlement Record
```
{
  "orderId": "ORD-20250101-0001",
  "orderTotal": 450,
  "commission": 45,       // 10% platform cut
  "riderPayout": 30,       // Rider delivery fee
  "netPayout": 375,        // orderTotal - commission - riderPayout
  "status": "PENDING",     // or "SETTLED"
  "createdAt": 1735689600000,
  "settledAt": null,
  "settledBy": null
}
```

## Filters
| Filter | Element | Action |
|---|---|---|
| Date From | `#reconFrom` | Filter by minimum date |
| Date To | `#reconTo` | Filter by maximum date |
| Outlet | `#filterOutlet` | Filter by specific outlet |
| Status | `#filterStatus` | Pending / Settled / All |

## Global KPIs (4)
| ID | Computation |
|---|---|
| `#reconGlobalRev` | Sum of `orderTotal` for all filtered records |
| `#reconGlobalComm` | Sum of `commission` |
| `#reconGlobalPending` | Sum of `netPayout` where status="PENDING" |
| `#reconGlobalSettled` | Sum of `netPayout` where status="SETTLED" |

## Settle Transaction Flow
```
settleTransaction(id, outletPath):
  1. Show SweetAlert2 confirm dialog with details
  2. On confirm:
     ├─ transaction on businesses/{bid}/outlets/{oid}/wallet
     ├─ push to businesses/{bid}/outlets/{oid}/ledger/{txId}
     ├─ update settlement: status="SETTLED", settledAt, settledBy
     └─ showToast("Settlement completed")
  3. loadReconciliations() to refresh
```

## Edge Cases
- **No settlements** → "No settlement records found" + zero KPIs
- **Date range with no data** → Empty table, KPIs show 0
- **Settlement with no wallet** → Transaction creates wallet if not existing
- **Concurrent settle** → transaction() prevents double-payout
- **CSV export with no data** → "No data to export" toast
