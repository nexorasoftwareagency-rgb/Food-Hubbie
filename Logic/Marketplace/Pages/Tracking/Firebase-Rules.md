# Tracking Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bizId}/outlets/{outletId}/orders/{orderId}` | Real-time order status (via OrderContext — from localStorage cache, not direct) |

## Paths Written
- Review submitted via ReviewModal → `businesses/{b}/outlets/{o}/reviews/{id}`
- Order marked as reviewed locally via `markOrderAsReviewed()`

## Notes
- Tracking page reads from `OrderContext.orders` (localStorage cache + Firebase fetch in OrderContext)
- Real-time updates would require Firebase `onValue` listener on the specific order
- Current implementation polls via OrderContext (not real-time listener on individual order)
