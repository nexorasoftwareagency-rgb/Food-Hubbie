# Orders Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bizId}/outlets/{outletId}/orders` | User's orders (filtered by userId field) |

## Notes
- Orders are fetched via `fetchOrdersFromFirebase(userId)` — reads all outlets and filters client-side
- Guest users see only localStorage orders (empty if never ordered)
- No direct Firebase writes from this page
