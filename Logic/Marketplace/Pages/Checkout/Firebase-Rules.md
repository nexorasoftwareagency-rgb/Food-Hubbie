# Checkout Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bizId}/outlets/{outletId}` | Fetch outlet details for fee calc |
| `system/promotions/surge` | Surge pricing config |
| `system/promotions/globalDiscount` | Global discount config |
| `system/promotions/coupons/{code}` | Coupon re-validation |
| `system/config/platformFee/amount` | Platform fee |
| `users/{userId}/wallet` | Wallet balance check |

## Paths Written
| Path | Purpose |
|---|---|
| `businesses/{bizId}/outlets/{outletId}/orders/{orderId}` | New order |
| `logs/marketplaceAudit` | Audit log entry |
| `users/{userId}/wallet` | Wallet deduction (if wallet payment) |
| `riders/{riderId}/ratings` | (Not written here — done via Tracking/Review) |

## Notes
- Order write is the most critical path — must validate auth.uid === userId
- Wallet deduction should be atomic (single-path write, not multi-path transaction)
