# KitchenPage Firebase Rules

## Orders Node
```
businesses/{b}/outlets/{o}/orders/{orderId}
```
- **Read**: admin only
- **Write**: admin only (status updates)

## Scope
- Kitchen only reads and writes the `status` field
- Reads: `customerName`, `cart`/`items`, `notes`/`specialInstructions`, `total`, `address`
- Writes: `status` (to advance or cancel)

## Notes
- Standard admin access rules apply
- No special rules beyond basic admin read/write
- Kitchen does NOT access riders or other nodes
