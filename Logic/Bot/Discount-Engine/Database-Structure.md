# Database Structure: Bot Discount Engine

## Nodes READ

### `{OUTLET}/discounts/`
```json
{
  "featureEnabled": true,
  "{discountId}": {
    "name": "Festive 5% Off",
    "type": "global | category | firstOrder | coupon",
    "mode": "percent | fixed",
    "value": 5,
    "maxCap": 100,
    "minSubtotal": 0,
    "categoryIds": [],
    "couponCode": "FESTIVE5",
    "startsAt": 1718000000000,
    "endsAt": 1718200000000,
    "stackable": false,
    "exclusiveGroup": "welcome",
    "perCustomerLimit": 0,
    "globalLimit": 0,
    "engineVersion": 1,
    "enabled": true,
    "stats": {
      "usedCount": 47,
      "totalDiscountGiven": 2310,
      "lastUsedAt": 1718150000000
    }
  }
}
```

### `{OUTLET}/discountsUsage/{usageId}`
```json
{
  "discountId": "{discountId}",
  "discountLabel": "Festive 5% Off",
  "orderId": "{orderId}",
  "customerPhone": "9876543210",
  "amountGiven": 50,
  "appliedAt": 1718150000000,
  "channel": "whatsapp",
  "source": "coupon:FESTIVE5"
}
```

### `customers/{phone}` (read for firstOrder check)
```json
{
  "firstOrderDiscountUsed": 1718100000000,
  "firstOrderDiscountId": "{discountId}",
  "orderCount": 3
}
```

## Nodes WRITTEN

### `{OUTLET}/discountsUsage/{usageId}` — new entry per order
### `{OUTLET}/discounts/{discountId}/stats` — atomic transaction (usedCount++, totalDiscountGiven +=)
### `customers/{phone}/firstOrderDiscountUsed` — set after first-order discount consumed
### `customers/{phone}/firstOrderDiscountId` — which discount was used
### `orders/{orderId}/discountSource` — `"coupon:FESTIVE5" | "firstOrder" | "auto:global" | "manual" | "none"`
### `orders/{orderId}/discountId` — the discount definition ID
### `orders/{orderId}/discountLabel` — human-readable name (e.g. "Festive 5% Off")

## Related docs
- `Logic/Admin-Dashboard/Discounts/Database-Structure.md` — Admin-side CRUD
- `docs/04-management/04-Business-Rules.md` — platform-level coupon system (separate from Roshani discounts)
