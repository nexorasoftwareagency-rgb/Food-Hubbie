# Promotions Tab — Database Structure

## Surge
`system/promotions/surge`
| Field | Type | Description |
|---|---|---|
| `multiplier` | number | Surge multiplier (>= 1.0) |
| `reason` | string | Display reason |
| `active` | boolean | Surge enabled |
| `updatedAt` | number | Last update |

## Global Discount
`system/promotions/globalDiscount`
| Field | Type | Description |
|---|---|---|
| `value` | number | Discount amount |
| `type` | string | `percent` or `fixed` |
| `active` | boolean | Discount enabled |
| `updatedAt` | number | Last update |

## Coupon
`system/promotions/coupons/{code}`
| Field | Type | Description |
|---|---|---|
| `code` | string | Promo code |
| `type` | string | `percent` or `fixed` |
| `discountValue` | number | Discount amount |
| `minOrderValue` | number | Minimum order (₹) |
| `maxUsage` | number | Total usage limit |
| `currentUsage` | number | Current usage count |
| `active` | boolean | Coupon active |
| `createdAt` | number | Creation time |

## Platform Fee
`system/config/platformFee`
| Field | Type | Description |
|---|---|---|
| `amount` | number | Fee per order |
| `active` | boolean | Fee enabled |
| `updatedAt` | number | Last update |
