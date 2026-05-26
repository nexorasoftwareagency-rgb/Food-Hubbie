# Settings Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `system/admins/{uid}/tfa` | Read, Write, Remove | 2FA config |
| `businesses/{bid}/outlets/{oid}/orders` | Read, Remove | Order retention |
| `system/auditLogs` | Read, Remove | Audit retention |
| `logs/marketplaceAudit` | Read, Remove | Marketplace audit retention |
| `logs/botAudit` | Read, Remove | Bot audit retention |
| `businesses/{bid}/outlets/{oid}/settlements` | Read, Remove | Settlement retention |
| `system/settlements` | Read | Settlement data |
| `archives/orders/{bid}/{oid}/{year}/{month}/{id}` | Write | Order archive |
| `archives/auditLogs/{year}/{month}/{id}` | Write | Audit log archive |
| `archives/marketplaceAudit/{year}/{month}/{id}` | Write | Marketplace audit archive |
| `archives/botAudit/{year}/{month}/{id}` | Write | Bot audit archive |
| `archives/settlements/{year}/{month}/{id}` | Write | Settlement archive |

## Rules
```json
{
  "rules": {
    "system": {
      "admins": {
        "$uid": {
          "tfa": {
            ".read": "auth.uid === $uid",
            ".write": "auth.uid === $uid"
          }
        }
      }
    },
    "archives": {
      ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
    }
  }
}
```

## Notes
- TFA data is admin-owner-only (each admin manages their own 2FA)
- Archives write requires superadmin/admin role
- Data retention requires elevated access to read/remove from business data paths
