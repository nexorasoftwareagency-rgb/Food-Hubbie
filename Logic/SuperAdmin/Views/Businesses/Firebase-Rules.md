# Businesses Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | Load all businesses |
| `system/admins` | `once('value')` | Admin email lookup |

## Rules
```json
{
  "rules": {
    "businesses": {
      ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business']"
    },
    "system": {
      "admins": {
        ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
      }
    }
  }
}
```
