# Riders Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `riders` | `on('value')` | Real-time rider list |
| `riders/{uid}` | Read, Write | Rider CRUD |
| `riders/{uid}/photoURL` | Write | Photo upload |
| `riders/{uid}/aadharImage` | Write | KYC upload |
| `system/auditLogs` | Push | Audit log |

## Storage Rules
```javascript
match /riders/{uid}/{fileName} {
  allow read: if request.auth != null;
  allow write: if request.auth != null
              && request.resource.size < 5 * 1024 * 1024;
}
```

## Notes
- Rider data accessible to superadmin/admin/business roles
- Storage upload requires auth but no role restriction (admin-only in practice via UI)
