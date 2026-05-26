# Audit Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `system/auditLogs` | `once('value')` | Admin audit logs |
| `logs/marketplaceAudit` | `once('value')` | Marketplace audit |
| `logs/botAudit` | `once('value')` | Bot audit |
| `logs/riderErrors` | `once('value')` | Rider errors |

## Rules
```json
{
  "rules": {
    "system": {
      "auditLogs": {
        ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
      }
    },
    "logs": {
      ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
    }
  }
}
```

## Notes
- All log paths read-only (no writes from audit console)
- Restricted to superadmin/admin only (sensitive data)
