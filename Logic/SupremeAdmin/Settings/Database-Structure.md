# Settings — Database Structure

## Paths Used

### TFA
| Path | Access | Purpose |
|------|--------|---------|
| /system/admins/{uid}/tfaSecret | Read/Write | TFA secret key |

### Data Retention
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders | Read/Delete | Archive/purge old orders |
| /businesses/{bid}/outlets/{oid}/settlements | Read/Delete | Archive/purge old settlements |
| /system/auditLogs | Read/Delete | Archive/purge old audit logs |
| /logs/marketplaceAudit | Read/Delete | Archive/purge old marketplace logs |
| /logs/botAudit | Read/Delete | Archive/purge old bot logs |
| /logs/riderErrors | Read/Delete | Archive/purge old rider errors |
| /archives/orders/{bid}/{oid}/{orderId} | Write | Archived orders |
| /archives/audit/{path}/{key} | Write | Archived audit logs |
| /archives/settlements/{bid}/{oid}/{sId} | Write | Archived settlements |

## Data Shapes

### TFA Secret
```json
{
  "system": {
    "admins": {
      "{uid}": {
        "email": "admin@email.com",
        "tfaSecret": "JBSWY3DPEHPK3PXP"
      }
    }
  }
}
```

### Archive Path Pattern
```json
{
  "archives": {
    "orders": { "{bid}": { "{oid}": { "{orderId}": { ...orderData } } } },
    "audit": { "{path}": { "{key}": { ...entryData } } },
    "settlements": { "{bid}": { "{oid}": { "{sId}": { ...settlementData } } } }
  }
}
```
