# LiveOpsPage Firebase Rules

## Orders Node
```
businesses/{b}/outlets/{o}/orders/{orderId}
```
- **Read**: admin only
- **Write**: admin only
- Same access pattern as Orders page

## Riders Node
```
riders/{riderId}
```
- **Read**: admin only
- Used for assigning riders to orders

## Notes
- Identical rules to Orders page
- No server-side validation for status transitions
