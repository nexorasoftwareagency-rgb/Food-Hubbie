# Inventory — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/menu | Read | Load all menu items |
| /businesses/{bid}/outlets/{oid}/menu/{dishId}/stock | Write (transaction) | Stock adjustment |
| /businesses/{bid}/outlets/{oid}/menu/{dishId}/available | Write | Availability toggle |

## Security Considerations
- Stock transaction requires atomic read-modify-write permission
- availability toggle is a simple boolean write
- menu items have image and description fields that are never modified from this tab

## Suggested Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "menu": {
            ".read": "auth != null",
            "$dishId": {
              "stock": {
                ".write": "auth != null",
                ".validate": "newData.isNumber() && newData.val() >= 0"
              },
              "available": {
                ".write": "auth != null",
                ".validate": "newData.isBoolean()"
              }
            }
          }
        }
      }
    }
  }
}
```
