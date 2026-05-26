# Dashboard Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `on('value')` | Real-time ecosystem data |
| `users` | `once('value')` | Customer count |

## Rules
```json
{
  "rules": {
    "businesses": {
      ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business', 'outlet', 'support']"
    },
    "users": {
      ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business', 'support']"
    }
  }
}
```

## Notes
- Dashboard is read-only (no writes)
- All authenticated admins can view dashboard data
- User count accessible to most roles (except outlet)
