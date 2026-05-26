# Audit — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /system/auditLogs/{key} | Read | SupremeAdmin actions |
| /logs/marketplaceAudit/{key} | Read | Marketplace user actions |
| /logs/botAudit/{key} | Read | Bot actions |
| /logs/riderErrors/{key} | Read | Rider error logs |

## Data Shapes

### SupremeAdmin Audit
```json
{
  "system": {
    "auditLogs": {
      "{key}": {
        "action": "Order Settled",
        "details": "Settled order FH-1717000000000-ABC for Biz/Outlet - Net: ₹202.50",
        "admin": "admin@email.com",
        "timestamp": 1717000000000,
        "type": "settlement"
      }
    }
  }
}
```

### Marketplace Audit
```json
{
  "logs": {
    "marketplaceAudit": {
      "{key}": {
        "action": "Order Placed",
        "details": "User placed order FH-...",
        "userId": "user_uid",
        "timestamp": 1717000000000
      }
    }
  }
}
```

### Bot Audit
```json
{
  "logs": {
    "botAudit": {
      "{key}": {
        "action": "BOT_RESET",
        "details": "Bot connection reset",
        "timestamp": 1717000000000
      }
    }
  }
}
```

### Rider Errors
```json
{
  "logs": {
    "riderErrors": {
      "{key}": {
        "action": "Location Error",
        "details": "Failed to get GPS coordinates",
        "riderId": "rider_uid",
        "timestamp": 1717000000000
      }
    }
  }
}
```

## Common Fields
All paths share: action (String), details (String), timestamp (Number)
Path-specific: admin, userId, riderId
