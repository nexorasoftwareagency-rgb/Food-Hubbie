# Completed View — Database Structure

## Ledger Entry (primary history source)
`riders/{uid}/ledger/{txId}`
| Field | Type | Description |
|---|---|---|
| `type` | string | `"delivery"` |
| `orderId` | string | Referenced order |
| `outletId` | string | Outlet identifier |
| `outletName` | string | For display |
| `amount` | number | Earnings |
| `cashCollected` | number | COD amount |
| `customerName` | string | For display |
| `customerPhone` | string | For display |
| `timestamp` | number | Completion time |
| `status` | string | `"completed"` |

## Order Detail (on card tap)
`businesses/{b}/outlets/{o}/orders/{id}`
| Field | Used For |
|---|---|
| `id` | Order number display |
| `customerName` | Header |
| `customerAddress` | Delivery address |
| `deliveryAddress` | Delivery address |
| `items` | Item list |
| `totalAmount` | Total |
| `deliveryFee` | Fee |
| `paymentMethod` | Payment info |
| `status` | Status badge |
| `timestamps` | Timeline display |

## Date Filter Computed
- Today: timestamp >= start of today (IST)
- This Week: timestamp >= start of current week (Monday)
- This Month: timestamp >= start of current month
- All: no filter
