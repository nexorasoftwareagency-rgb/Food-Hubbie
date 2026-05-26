# Available View — Firebase Rules

## Paths Accessed
| Path | Access |
|---|---|
| `businesses/{b}/outlets` | Read — all outlets |
| `businesses/{b}/outlets/{o}/orders/{id}` | Read (any), Write (if assigned) |
| `businesses/{b}/outlets/{o}/settings/Delivery` | Read — proximity settings |
| `businesses/{b}/outlets/{o}/botCommands` | Write — WhatsApp notification |

## Key Rule for Assignment
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "orders": {
            "$orderId": {
              ".write": "auth != null && (
                data.child('assignedRider').val() == auth.uid ||
                !data.hasChild('assignedRider')
              )"
            }
          }
        }
      }
    }
  }
}
```
Assignment only allowed if no rider currently assigned (enforced by `runTransaction`).
