# Delivery Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `system/settings/delivery` | Read, Write | Delivery config |

## Rules
```json
{
  "rules": {
    "system": {
      "settings": {
        "delivery": {
          ".read": "auth != null",
          ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
        }
      }
    }
  }
}
```

## Notes
- Read: all authenticated users
- Write: superadmin and admin only
