# Inventory Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | Scan all businesses/outlets |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}` | Read, Write | Stock adjustment |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}/stock` | Write | Stock value |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}/isAvailable` | Write | Toggle |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}/lastStockUpdate` | Write | Timestamp |

## Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "dishes": {
            "$dishId": {
              ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']",
              "stock": { ".validate": "newData.isNumber() && newData.val() >= 0" },
              "isAvailable": { ".validate": "newData.isBoolean()" }
            }
          }
        }
      }
    }
  }
}
```

## Notes
- Stock validation ensures non-negative values
- Availability must be boolean
- Write restricted to superadmin/admin
