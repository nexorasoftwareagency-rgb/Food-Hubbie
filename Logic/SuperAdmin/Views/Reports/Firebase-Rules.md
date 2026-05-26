# Reports Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | Aggregate orders |
| `system/auditLogs` | `once('value')` | Audit log in report |

## Rules
```json
{
  "rules": {
    "businesses": {
      ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
    },
    "system": {
      "auditLogs": {
        ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
      }
    }
  }
}
```

## Notes
- Reports restricted to superadmin/admin (sensitive financial data)
- Read-only access
