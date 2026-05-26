# Promotions Tab — Code Logics

## Purpose
Promotions management center — surge pricing, global discount, platform fee, and coupon code registry.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadPromotions()` | Tab load | Load surge + global discount + coupons |
| `saveSurge()` | Apply button | Save surge multiplier + reason |
| `saveGlobalDiscount()` | Apply button | Save discount value + type |
| `savePlatformFee()` | Update button | Save platform fee amount |
| `saveCoupon()` | Generate Code | Create coupon (rate-limited) |
| `toggleCoupon(code)` | Toggle button | Activate/deactivate coupon |
| `deleteCoupon(code)` | Delete button | Remove coupon |
| `exportCoupons()` | Export button | CSV export of all coupons |
| `bulkOperation(op)` | Pause All | Bulk update coupons |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `system/promotions/surge` | `set()` | Surge config |
| `system/promotions/globalDiscount` | `set()` | Discount config |
| `system/promotions/coupons/{code}` | Read/Write | Coupon CRUD |
| `system/config/platformFee` | `set()` | Fee config |
| `system/auditLogs` | Push | Audit trail |

## Surge Pricing
| Field | ID | Description |
|---|---|---|
| Multiplier | `#surgeMultiplier` | 1.0 = normal, 1.5 = 50% surge |
| Reason | `#surgeReason` | Display reason (e.g., "Peak Hours") |
| Status | `#surgeStatus` | Active/Inactive badge |

## Global Discount
| Field | ID | Description |
|---|---|---|
| Value | `#globalDiscountValue` | Discount amount |
| Type | `#globalDiscountType` | Percent or Fixed |
| Status | `#discountStatus` | Active/Inactive badge |

## Platform Fee
| Field | ID | Description |
|---|---|---|
| Amount | `#platformFee` | Fee per order |
| Status | `#feeStatus` | Active badge |

## Coupon Registry
| Column | Source |
|---|---|
| Promo Code | `coupon.code` |
| Benefit Configuration | `coupon.discountValue` + `coupon.type` |
| Usage Constraints | `coupon.minOrderValue`, `coupon.maxUsage` |
| Current Status | `coupon.active` → Active/Inactive badge |
| Operations | Toggle / Delete buttons |

## Rate Limiting
```javascript
checkRateLimit('CREATE_COUPON'):
  Max 10 coupons per minute
  Stored in _rateLimitStore (in-memory, session-only)
```

## Edge Cases
- **No coupons** → "No coupons registered" empty state
- **Rate limit hit** → Toast "Please wait before creating more coupons"
- **Duplicate coupon code** → Write overwrites existing (no uniqueness check)
- **Surge multiplier < 1.0** → Validated in `saveSurge()` — should be >= 1.0
- **Export with no coupons** → "No data to export" toast
