# Audit — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /system/auditLogs | Read | SupremeAdmin audit entries |
| /logs/marketplaceAudit | Read | Marketplace audit entries |
| /logs/botAudit | Read | Bot audit entries |
| /logs/riderErrors | Read | Rider error entries |

## Security Considerations
- Audit logs are read-only from this interface
- 4 separate paths must all be readable by authenticated admins
- No PII should be in audit logs (but depends on what apps log)
- Rider errors path contains app error logs — may contain device info

## Suggested Rules
```json
{
  "system": {
    "auditLogs": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  },
  "logs": {
    ".read": "auth != null",
    ".write": "auth != null",
    "marketplaceAudit": { ".read": "auth != null" },
    "botAudit": { ".read": "auth != null" },
    "riderErrors": { ".read": "auth != null" }
  }
}
```
