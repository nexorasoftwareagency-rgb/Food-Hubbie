# Promotions — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /system/promotions/surge | Read/Write | Surge pricing config |
| /system/promotions/globalDiscount | Read | Discount config (no write handler) |
| /system/promotions/coupons | Read/Write | Coupons CRUD |
| /system/promotions/coupons/{cid}/active | Write | Toggle coupon active state |
| /system/config/platformFee | Read | Fee config (no write handler) |

## Security Considerations
- /system/promotions/surge modifyable by any admin — no approval workflow
- Coupon code field should be unique but no DB-side enforcement
- No validation on discount value (could be >100% for percentage type)

## Suggested Rules
```json
{
  "system": {
    "promotions": {
      ".read": "auth != null",
      "surge": {
        ".write": "auth != null",
        ".validate": "newData.hasChildren(['multiplier', 'enabled'])"
      },
      "coupons": {
        ".write": "auth != null",
        "$cid": {
          ".validate": "newData.hasChildren(['code', 'type', 'value'])"
        }
      },
      "globalDiscount": {
        ".write": "auth != null"
      }
    },
    "config": {
      "platformFee": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```
