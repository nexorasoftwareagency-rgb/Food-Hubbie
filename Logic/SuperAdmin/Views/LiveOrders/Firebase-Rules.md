# Live Orders Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `on('value')` | Real-time order aggregation |
| `businesses/{bid}/outlets/{oid}/orders/{id}/status` | Write | Status update |

## Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "orders": {
            "$orderId": {
              ".read": "auth != null",
              ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business', 'outlet']",
              "status": {
                ".validate": "newData.val() in ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Reached Drop Location', 'Delivered', 'Cancelled']"
              }
            }
          }
        }
      }
    }
  }
}
```

## Notes
- Order status validated against allowed values
- All admin roles can read orders, most can write
- Status update writes only the `status` field (not the entire order)
