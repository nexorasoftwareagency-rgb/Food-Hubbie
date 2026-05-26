# Outlets Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `businesses/{bid}/outlets/{oid}` | Read, Write | Outlet CRUD |
| `businesses/{bid}` | Read | Business name |
| `system/admins/{uid}` | Read, Write | Admin email lookup, password update |
| `businesses/{bid}/outlets/{oid}/orders` | Read (limited) | Profile analytics |
| `businesses/{bid}/outlets/{oid}/reviews` | Read | Rating computation |

## Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          ".read": "auth != null",
          ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business']"
        }
      }
    }
  }
}
```

## Notes
- Profile view requires read on orders + reviews (sensitive data)
- Outlet edit restricted to superadmin/admin/business roles
- Password update on system/admins requires elevated access
