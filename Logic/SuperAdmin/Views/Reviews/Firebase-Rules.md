# Reviews Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses/{bid}/outlets/{oid}/reviews` | `once('value')` | Read all reviews |

## Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "reviews": {
            ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business', 'outlet', 'support']"
          }
        }
      }
    }
  }
}
```

## Notes
- Read-only access (no review deletion/modification from this tab)
- All admin roles can view reviews
