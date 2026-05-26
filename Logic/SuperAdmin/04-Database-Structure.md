# SuperAdmin — Database Structure

## System Admin
`system/admins/{uid}`
| Field | Type | Description |
|---|---|---|
| `email` | string | Admin email |
| `name` | string | Display name |
| `role` | string | `superadmin`, `admin`, `business`, `outlet`, `support` |
| `isSuper` | boolean | Super admin flag |
| `isActive` | boolean | Account active/inactive |
| `password` | string | Plaintext password (known security concern) |
| `phone` | string | Mobile number |
| `tfa/enabled` | boolean | 2FA enabled |
| `tfa/secret` | string | TOTP secret |
| `createdAt` | number | Account creation timestamp |

## Onboarding Request
`onboarding_requests/{uid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Partner name |
| `email` | string | Partner email |
| `phone` | string | Partner phone |
| `businessName` | string | Business name |
| `businessSlug` | string | Business ID |
| `outletName` | string | Outlet name |
| `outletSlug` | string | Outlet ID |
| `address` | string | Outlet address |
| `lat` | number | Outlet latitude |
| `lng` | number | Outlet longitude |
| `status` | string | `pending`, `approved`, `rejected` |
| `submittedAt` | number | Submission timestamp |
| `approvedAt` | number | Approval timestamp |
| `approvedBy` | string | Admin UID who approved |

## Business
`businesses/{bid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Business name |
| `bid` | string | Business ID |
| `commission` | number | Commission percentage |
| `fixedCommission` | number | Fixed commission fee |
| `phone` | string | Contact phone |
| `address` | string | Address |
| `createdAt` | number | Creation timestamp |
| `isActive` | boolean | Active status |

## Outlet
`businesses/{bid}/outlets/{oid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Outlet name |
| `id` | string | Outlet ID |
| `slug` | string | URL slug |
| `address` | string | Address |
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `email` | string | Admin email |
| `phone` | string | Contact phone |
| `password` | string | Admin password (plaintext) |
| `isActive` | boolean | Active status |
| `registeredAt` | number | Registration timestamp |

## Order (business-scoped)
`businesses/{bid}/outlets/{oid}/orders/{orderId}`
Standard order schema with fields: `status`, `customerName`, `items`, `totalAmount`, `deliveryFee`, `assignedRider`, `paymentMethod`, timestamps.

## Settlement
`businesses/{bid}/outlets/{oid}/settlements/{settlementId}`
| Field | Type | Description |
|---|---|---|
| `orderId` | string | Related order |
| `orderTotal` | number | Order amount |
| `commission` | number | Platform commission |
| `riderPayout` | number | Rider payout |
| `netPayout` | number | Net amount |
| `status` | string | `PENDING`, `SETTLED` |
| `createdAt` | number | Timestamp |
| `settledAt` | number | Settlement timestamp |
| `settledBy` | string | Admin UID |

## Dish / Inventory
`businesses/{bid}/outlets/{oid}/dishes/{dishId}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Dish name |
| `price` | number | Price |
| `category` | string | Category |
| `stock` | number | Stock quantity |
| `isAvailable` | boolean | Availability |
| `lastStockUpdate` | number | Last update timestamp |

## Rider
`riders/{uid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Rider name |
| `phone` | string | Phone |
| `email` | string | Auth email |
| `status` | string | `online`, `offline`, `busy` |
| `isActive` | boolean | Active/suspended |
| `photoURL` | string | Profile image URL |
| `aadharImage` | string | KYC image URL |
| `vehicle` | string | Bike/Car/Walk |
| `wallet/balance` | number | Wallet balance |

## User (customer)
`users/{uid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Customer name |
| `email` | string | Email |
| `phone` | string | Phone |
| `walletBalance` | number | Wallet balance |
| `walletHistory/{txId}/amount` | number | Transaction amount |
| `walletHistory/{txId}/reason` | string | Transaction reason |
| `walletHistory/{txId}/timestamp` | number | Transaction time |
| `createdAt` | number | Account creation |

## System Delivery Settings
`system/settings/delivery`
| Field | Type | Description |
|---|---|---|
| `mode` | string | `per_100m` or `slabs` |
| `per100mRate` | number | Rate per 100m |
| `slabs/{index}/maxKm` | number | Slab max distance |
| `slabs/{index}/cost` | number | Slab cost |

## System Promotions
`system/promotions/surge`
| Field | Type | Description |
|---|---|---|
| `multiplier` | number | Surge multiplier |
| `reason` | string | Surge reason |
| `active` | boolean | Surge active |
| `updatedAt` | number | Last update |

`system/promotions/globalDiscount`
| Field | Type | Description |
|---|---|---|
| `active` | boolean | Discount active |
| `value` | number | Discount value |
| `type` | string | `percent` or `fixed` |
| `updatedAt` | number | Last update |

`system/promotions/coupons/{code}`
| Field | Type | Description |
|---|---|---|
| `code` | string | Coupon code |
| `type` | string | `percent` or `fixed` |
| `discountValue` | number | Discount amount |
| `minOrderValue` | number | Minimum order |
| `maxUsage` | number | Usage limit |
| `currentUsage` | number | Current usage count |
| `active` | boolean | Active/inactive |
| `createdAt` | number | Creation timestamp |

## System Config
`system/config/platformFee`
| Field | Type | Description |
|---|---|---|
| `amount` | number | Platform fee |
| `active` | boolean | Fee active |
| `updatedAt` | number | Last update |

## Broadcast
`system/broadcasts/{key}`
| Field | Type | Description |
|---|---|---|
| `title` | string | Broadcast title |
| `body` | string | Message body |
| `audience` | string | Target audience type |
| `category` | string | Category |
| `image` | string | Image URL |
| `sentBy` | string | Admin UID |
| `sentAt` | number | Send timestamp |
| `stats/sent` | number | Delivery count |

## Audit Log
`system/auditLogs/{logId}`
| Field | Type | Description |
|---|---|---|
| `timestamp` | number | Event time |
| `adminId` | string | Admin UID |
| `adminEmail` | string | Admin email |
| `action` | string | Action name |
| `details` | object | Action details |
| `ip` | string | Source IP |

## Reviews
`businesses/{bid}/outlets/{oid}/reviews/{reviewId}`
| Field | Type | Description |
|---|---|---|
| `userId` | string | Reviewer UID |
| `rating` | number | 1-5 rating |
| `comment` | string | Review text |
| `timestamp` | number | Review time |

## Archives
`archives/{type}/{bid}/{oid}/{year}/{month}/{id}` — Mirrors original document structure with added `_archivedAt` timestamp.
