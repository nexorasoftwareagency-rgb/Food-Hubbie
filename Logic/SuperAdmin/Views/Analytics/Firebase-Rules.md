# Analytics Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | Aggregate all businesses/outlets/orders |

## Rules
```json
{
  "businesses": {
    ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
  }
}
```

## Notes
- Restricted to superadmin/admin roles only
- Read-only access (no writes from this tab)
