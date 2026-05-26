# OrdersPage Firebase Rules

## Orders Node
```
businesses/{b}/outlets/{o}/orders/{orderId}
```
- **Read**: admin only
- **Write**: admin only
- Used for: CRUD operations, status updates, rider assignment

## Riders Node
```
riders/{riderId}
```
- **Read**: admin only
- Used for: fetching rider details during assignment

## Notes
- No server-side validation rules for status transitions
- All validation happens client-side in `updateStatus()`
- Consider adding Firebase rules to prevent unauthorized status changes
