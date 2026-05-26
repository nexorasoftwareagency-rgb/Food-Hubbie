# Live Orders — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders | Read | Load all orders |
| /businesses/{bid}/outlets/{oid}/orders/{orderId}/status | Write | Update order status |

## Security Considerations
- Reading all orders across all businesses requires read access to entire /businesses subtree
- Status updates write directly to order records — no validation on allowed status transitions
- No audit trail for admin-initiated status changes

## Suggested Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "orders": {
            ".read": "auth != null",
            "$orderId": {
              "status": {
                ".write": "auth != null",
                ".validate": "newData.isString() && newData.val().length > 0"
              }
            }
          }
        }
      }
    }
  }
}
```

## Performance Note
- No .indexOn for orders by timestamp — sorting is done client-side
- Deep nesting (businesses → outlets → orders) requires broad read permissions
