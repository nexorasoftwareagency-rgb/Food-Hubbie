# Promotions — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /system/promotions/surge | Read/Write | Surge pricing |
| /system/promotions/globalDiscount | Read | Global discount (write broken) |
| /system/promotions/coupons/{cid} | Read/Write | Coupons |
| /system/config/platformFee | Read | Platform fee (write broken) |

## Data Shapes

### Surge Pricing
```json
{
  "system": {
    "promotions": {
      "surge": {
        "enabled": true,
        "multiplier": 1.5,
        "threshold": 50,
        "startTime": "18:00",
        "endTime": "22:00"
      }
    }
  }
}
```

### Global Discount
```json
{
  "globalDiscount": {
    "active": true,
    "type": "percentage",
    "value": 10
  }
}
```

### Platform Fee
```json
{
  "system": {
    "config": {
      "platformFee": {
        "type": "fixed",
        "value": 5
      }
    }
  }
}
```

### Coupon
```json
{
  "coupons": {
    "{cid}": {
      "code": "SAVE20",
      "type": "percentage",
      "value": 20,
      "minOrder": 100,
      "usageLimit": 100,
      "active": true
    }
  }
}
```

## Coupon Fields
- code: String (required, unique by convention)
- type: "percentage" | "flat"
- value: Number (percentage value or flat amount in ₹)
- minOrder: Number (minimum order value to apply)
- usageLimit: Number (max number of uses)
- active: Boolean (toggle on/off)
