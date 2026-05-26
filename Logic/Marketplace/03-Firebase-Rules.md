# Marketplace — Firebase Rules

## Authentication
- Google sign-in (popup + redirect)
- Customer data stored under `users/{uid}` (owner access only)
- No admin UID management needed

## Database Path Access Patterns

### Public Read (unauthenticated)
| Path | Content |
|---|---|
| `businesses/{bizId}/outlets/{outletId}/` | Outlet metadata, dishes, categories, settings |
| `system/platformConfig/cuisines` | Cuisine list |
| `slugs/outlets/{slug}` | Slug → bizId/outletId mapping |

### Authenticated User (owner — `users/{uid}`)
| Path | Content |
|---|---|
| `users/{uid}/` | Profile, addresses, wallet, fcmToken |
| `customers/{uid}/cart/` | Persisted cart |
| `businesses/{b}/outlets/{o}/orders/{orderId}` | User's own orders |

### Admin Write
| Path | Content |
|---|---|
| `businesses/{b}/outlets/{o}/orders/{id}` | Order creation (via service) |
| `logs/marketplaceAudit` | Audit trail |
| `reviews/` | Customer reviews |

### System Config (admin only)
| Path | Content |
|---|---|
| `system/config/platformFee/amount` | Platform fee |
| `system/promotions/surge` | Surge pricing |
| `system/promotions/globalDiscount` | Global discount |
| `system/promotions/coupons/{code}` | Coupon definitions |

## Notes
- Marketplace uses Firebase Client SDK — security rules ARE enforced (unlike bot Admin SDK)
- Write rules should validate order ownership (userId matches auth.uid)
- Cart persistence uses `customers/{uid}/cart` — write rule must check auth.uid === uid
