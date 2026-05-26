# Live Orders Tab — Database Structure

## Order (aggregated)
`businesses/{bid}/outlets/{oid}/orders/{orderId}`
| Field | Used For |
|---|---|
| `id` | Order ID display |
| `status` | Pipeline categorization, badge |
| `customerName` | Customer display |
| `items` | Item count |
| `totalAmount` | Amount display |
| `deliveryFee` | Fee display |
| `assignedRider` | Rider display |
| `riderName` | Rider name |
| `createdAt` | Age computation + SLA |
| `paymentMethod` | Payment info |

## SLA Computation
```javascript
ageMs = Date.now() - order.createdAt
ageMin = Math.floor(ageMs / 60000)

if (ageMin > 30 && status === 'Placed') → SLA BREACH
```

## Order Age Color Coding
| Threshold | Color |
|---|---|
| `< 15 min` | Green |
| `15-30 min` | Yellow/Orange |
| `> 30 min` | Red (SLA breach) |

## Kanban Columns
| Column | Matching Statuses |
|---|---|
| New / Pending | `Placed`, `Confirmed` |
| Preparing | `Preparing` |
| Out for Delivery | `Out for Delivery`, `Reached Drop Location` |
| Delivered | `Delivered` |
