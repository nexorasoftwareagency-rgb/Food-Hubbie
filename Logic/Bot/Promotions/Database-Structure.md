# Database Structure: Bot Promotions Module

## Nodes READ/WRITE

### `bot/{outlet}/promotions/campaigns/{campaignId}`
```json
{
  "name": "Festive Sale",
  "template": "Hello {name}! 🎉 Flat 20% OFF...",
  "mediaUrl": null,
  "recipientsCount": 142,
  "createdBy": "admin@...",
  "createdAt": 1718000000000,
  "status": "queued | running | paused | done | stopped | scheduled | expired",
  "totalSent": 87,
  "totalFailed": 2,
  "currentIndex": 87,
  "startedAt": 1718000100000,
  "completedAt": null,
  "runAt": null,
  "audit": [
    { "at": 1718000100000, "by": "admin@...", "action": "started", "note": "" }
  ]
}
```

### `bot/{outlet}/promotions/logs/{campaignId}/{phone}`
```json
{
  "jid": "919876543210@s.whatsapp.net",
  "status": "sent | failed | skipped",
  "sentAt": 1718000150000,
  "error": null,
  "couponCode": "FESTIVE-A4B7"
}
```

### `bot/{outlet}/promotions/optout/{jid}`
```json
{
  "optedOutAt": 1718000000000,
  "phone": "919876543210",
  "reOptInAt": null
}
```

### `bot/{outlet}/promotions/templates/{templateId}`
```json
{
  "name": "Festive Greeting",
  "body": "Hello {name}! 🎉...",
  "mediaUrl": null,
  "createdAt": 1718000000000
}
```

### `bot/{outlet}/promotions/coupons/{code}`
```json
{
  "campaignId": "PROMO-1709123456-AB12",
  "recipientPhone": "919876543210",
  "generatedAt": 1718000000000,
  "redeemed": false
}
```

### `bot/{outlet}/promotions/lock`
```json
{
  "campaignId": "PROMO-1709123456-AB12",
  "acquiredAt": 1718000100000,
  "acquiredBy": "bot-pizza"
}
```
Or `null` when no campaign is running.

### `bot/{outlet}/promotions/killSwitch`
- `true` → all campaigns pause before next send
- `false` or absent → normal operation

### `bot/{outlet}/promotions/enabled`
- `true` → promotions module active
- `false` → Admin UI hides Promotions tab, bot ignores SEND_PROMOTION commands

### `bot/{outlet}/commands/{cmdId}`
```json
{
  "action": "SEND_PROMOTION",
  "campaignId": "PROMO-1709123456-AB12",
  "template": "Hello {name}!...",
  "mediaUrl": null,
  "recipients": ["919876543210", ...],
  "delayMs": 2000,
  "generateCoupons": false,
  "quietHours": { "start": 22, "end": 9 },
  "runAt": null,
  "requestedBy": "admin@..."
}
```

## Related docs
- `Logic/Admin-Dashboard/Promotions/Database-Structure.md` — Admin-side schema
- `Logic/Bot/Discount-Engine/Database-Structure.md` — discount usage records
