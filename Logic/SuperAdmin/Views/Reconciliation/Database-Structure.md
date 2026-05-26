# Reconciliation Tab — Database Structure

## Settlement
`businesses/{bid}/outlets/{oid}/settlements/{settlementId}`
| Field | Type | Description |
|---|---|---|
| `orderId` | string | Related order ID |
| `orderTotal` | number | Full order amount |
| `commission` | number | Platform commission (calculated) |
| `riderPayout` | number | Rider delivery fee |
| `netPayout` | number | `orderTotal - commission - riderPayout` |
| `outletName` | string | Denormalized for display |
| `businessName` | string | Denormalized for display |
| `status` | string | `PENDING` or `SETTLED` |
| `createdAt` | number | Settlement creation timestamp |
| `settledAt` | number | Settlement processing timestamp |
| `settledBy` | string | Admin UID who processed |

## Wallet
`businesses/{bid}/outlets/{oid}/wallet`
| Field | Type | Description |
|---|---|---|
| `balance` | number | Current wallet balance |

## Ledger Entry
`businesses/{bid}/outlets/{oid}/ledger/{txId}`
| Field | Type | Description |
|---|---|---|
| `type` | string | `"settlement"` |
| `amount` | number | Amount settled |
| `orderId` | string | Related order |
| `timestamp` | number | Settlement time |

## Computed KPIs (client-side)
| KPI | Formula |
|---|---|
| Total Volume | `sum(all filtered settlements, orderTotal)` |
| Platform Commissions | `sum(all filtered settlements, commission)` |
| Pending Settlements | `sum(filtered settlements where PENDING, netPayout)` |
| Total Settled | `sum(filtered settlements where SETTLED, netPayout)` |
