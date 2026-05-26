# Settlements — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders | Read | Compute settlement data |
| /businesses/{bid}/outlets/{oid}/settlements | Write | Create settlement record |
| /system/auditLogs | Write | Audit trail |
| /businesses/{bid}/commission | Read | Commission calculation |

## Security Considerations
- Settlement records are immutable once written (no update/delete from UI)
- Audit logs should not be deletable by regular admins
- Settlement netAmount is computed client-side — could be manipulated

## Suggested Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "settlements": {
            ".write": "auth != null",
            "$sid": {
              ".validate": "newData.hasChildren(['orderId', 'amount', 'netAmount', 'status'])"
            }
          }
        }
      }
    }
  }
}
```
