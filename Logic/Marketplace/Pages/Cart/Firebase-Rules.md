# Cart Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bizId}/outlets/{outletId}` | Fetch outlet info for header |
| `system/promotions/coupons/{code}` | Validate coupon code |

## Paths Written
- Cart persistence handled by CartContext (`customers/{userId}/cart`)
- Cart page itself does not write to Firebase

## Notes
- Coupon validation reads from `system/promotions/coupons/{code}` — public read or admin-managed
- Guest users cannot apply coupons (no userId for coupon tracking)
