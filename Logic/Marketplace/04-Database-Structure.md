# Marketplace — Database Structure

All data stored in Firebase Realtime Database under `food-hubbie` project.

## Users
Path: `users/{userId}`
| Field | Type | Description |
|---|---|---|
| `id` | string | Firebase Auth UID |
| `name` | string | Display name |
| `phone` | string | 10-digit |
| `email` | string | Email (from Google) |
| `avatar` | string | Photo URL |
| `loyaltyPoints` | number | Accumulated points |
| `wallet/balance` | number | Wallet balance (paise) |
| `wallet/history/{txnId}` | object | Transaction record |
| `savedAddresses` | array | Delivery addresses |
| `fcmToken` | string | Push notification token |
| `createdAt` | string | ISO timestamp |

## Outlets
Path: `businesses/{bizId}/outlets/{outletId}/`
| Collection | Description |
|---|---|
| `settings/Store` | Name, address, hours, coords, images |
| `settings/Delivery` | Delivery fee config, slabs |
| `settings/Bot` | WhatsApp images, bot config |
| `dishes/{dishId}` | Menu items (name, price, sizes, addons, stock) |
| `categories/{catId}` | Category name, order, image |
| `orders/{orderId}` | Customer orders |
| `reviews/{reviewId}` | Customer reviews |

## Orders
Path: `businesses/{bizId}/outlets/{outletId}/orders/{orderId}`
| Field | Type | Description |
|---|---|---|
| `id` | string | `FH-{ts}-{rand}` |
| `userId` | string | Customer UID |
| `outletId` | string | Outlet ID |
| `outletName` | string | Denormalized |
| `items` | array | Order items with customization |
| `subtotal` | number | Before fees |
| `deliveryFee` | number | Calculated |
| `taxes` | number | Tax amount |
| `total` | number | Final total |
| `status` | string | Placed → ... → Delivered/Cancelled |
| `statusHistory` | array | `[{status, timestamp}]` |
| `paymentMethod` | string | upi/card/wallet/cod |
| `deliveryAddress` | object | Name, phone, address, coords |
| `couponCode` | string | Applied coupon |
| `couponDiscount` | number | Discount from coupon |
| `globalDiscount` | number | Platform discount |
| `platformFee` | number | Platform fee |
| `cashbackBonus` | number | Cashback earned |
| `riderName` | string | Assigned rider |
| `isReviewed` | boolean | Review submitted |
| `createdAt` | string | ISO timestamp |
| `updatedAt` | string | ISO timestamp |

## Cart (persisted)
Path: `customers/{userId}/cart`
| Field | Type | Description |
|---|---|---|
| `items` | array | CartItem array |
| `outletId` | string | Current outlet |
| `appliedCoupon` | object/null | Applied coupon data |
| `updatedAt` | number | Epoch timestamp |

## System Config
| Path | Content |
|---|---|
| `system/config/platformFee/amount` | Platform fee (default 5) |
| `system/promotions/surge` | `{ multiplier, active }` |
| `system/promotions/globalDiscount` | `{ percent, active }` |
| `system/promotions/coupons/{code}` | `{ type, discount, minOrder, maxDiscount }` |
| `system/platformConfig/cuisines` | String array of cuisine names |
| `system/settings/delivery/slabs` | Global default delivery slabs |

## Other
| Path | Content |
|---|---|
| `slugs/outlets/{slug}` | `{ businessId, outletId }` |
| `logs/marketplaceAudit` | Audit trail entries |
| `riders/{riderId}/ratings` | Rider ratings from reviews |
| `system/broadcasts` | Real-time admin broadcast messages |
