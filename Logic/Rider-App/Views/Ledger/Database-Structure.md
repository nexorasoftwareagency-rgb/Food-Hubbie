# Ledger View — Database Structure

## Wallet
`riders/{uid}/wallet`
| Field | Type | Description |
|---|---|---|
| `balance` | number | Current wallet balance |
| `totalEarned` | number | Lifetime total earnings |
| `pendingSettlement` | number | Cash awaiting settlement |
| `lastUpdated` | number | Last wallet update timestamp |

## Ledger Entry
`riders/{uid}/ledger/{txId}`
| Field | Type | Description |
|---|---|---|
| `type` | string | `"delivery"`, `"settlement"`, `"adjustment"` |
| `orderId` | string | Related order (for deliveries) |
| `outletName` | string | For display |
| `amount` | number | +/- amount |
| `cashCollected` | number | Cash collected (COD) |
| `customerName` | string | For display |
| `timestamp` | number | Epoch ms |
| `status` | string | `"completed"`, `"pending"` |

## Settlement
`settlements/{uid}/{settlementId}`
| Field | Type | Description |
|---|---|---|
| `amount` | number | Amount to settle |
| `status` | string | `"pending"`, `"approved"`, `"completed"`, `"rejected"` |
| `requestedAt` | number | Request timestamp |
| `processedAt` | number | Admin processing timestamp |
| `adminNote` | string | Admin remark |
