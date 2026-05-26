# Settings — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /system/admins/{uid}/tfaSecret | Read/Write | TFA secret |
| /businesses/{bid}/outlets/{oid}/orders | Read/Delete | Data retention (orders) |
| /businesses/{bid}/outlets/{oid}/settlements | Read/Delete | Data retention (settlements) |
| /system/auditLogs | Read/Delete | Data retention (audit) |
| /logs/marketplaceAudit | Read/Delete | Data retention (audit) |
| /logs/botAudit | Read/Delete | Data retention (audit) |
| /logs/riderErrors | Read/Delete | Data retention (audit) |
| /archives | Write | Archive storage |

## Security Considerations
- TFA secret stored in RTDB — database access = TFA compromise
- Data retention can delete large amounts of data irreversibly
- Archive writes to /archives before deletion (safety net for purge)
- No validation on retention days input (could delete all data)

## Suggested Rules
```json
{
  "archives": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
