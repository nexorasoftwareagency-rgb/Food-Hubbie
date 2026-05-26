# Settlements — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders | Read | Order data |
| /businesses/{bid}/outlets/{oid}/settlements | Write | Settlement records |
| /system/auditLogs | Write | Audit trail |
| /businesses/{bid}/commission | Read | Commission config |

## Data Shapes

### Settlement Record
```json
{
  "businesses": {
    "{bid}": {
      "outlets": {
        "{oid}": {
          "settlements": {
            "{sid}": {
              "orderId": "FH-1717000000000-ABC",
              "amount": 250,
              "commission": 37.5,
              "commissionPercent": 15,
              "fixedFee": 10,
              "netAmount": 202.5,
              "status": "settled",
              "settledAt": 1717000000000
            }
          }
        }
      }
    }
  }
}
```

### Audit Log Entry
```json
{
  "system": {
    "auditLogs": {
      "{key}": {
        "action": "Order Settled",
        "details": "Settled order FH-... for outlet Biz/Outlet - Net: ₹202.50",
        "admin": "admin@email.com",
        "timestamp": 1717000000000,
        "type": "settlement"
      }
    }
  }
}
```

## Settlement Calculation
- amount: order.total
- commission: amount * (commissionPercent / 100)
- fixedFee: from business commission config
- netAmount: amount - commission - fixedFee
