# Broadcast Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `system/broadcasts/{key}` | Push, Once | Broadcast storage |
| `system/auditLogs` | Push | Audit log |

## Rules
```json
{
  "rules": {
    "system": {
      "broadcasts": {
        ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'support']",
        ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'support']"
      }
    }
  }
}
```

## Notes
- Accessible to superadmin, admin, and support roles
- No per-broadcast rules (all-or-nothing on the entire broadcasts path)
