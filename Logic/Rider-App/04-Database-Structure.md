# Rider App — Database Structure

## Rider Profile
Path: `riders/{uid}`
| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `name` | string | Rider name |
| `phone` | string | 10-digit mobile |
| `email` | string | Auth email (phone@rider.com) |
| `role` | string | `"rider"` |
| `status` | string | `"online"`, `"offline"`, `"busy"` |
| `isActive` | boolean | Admin suspension flag |
| `lastSeen` | number | Epoch timestamp |
| `photoURL` | string | Profile image URL |
| `fcmToken` | string | Push notification token |
| `fcmTokens` | object | Multiple device tokens |
| `wallet/balance` | number | Current balance |
| `wallet/totalEarned` | number | Lifetime earnings |
| `address` | string | Rider address |
| `vehicle` | string | Bike/Car/Walk |
| `aadhar` | string | Aadhar number |
| `aadharImage` | string | Aadhar photo URL |
| `fatherName` | string | Father's name |
| `age` | number | Rider age |
| `qualification` | string | Education |
| `accountNumber` | string | Bank account |
| `ifsc` | string | Bank IFSC |

## Order
Path: `businesses/{b}/outlets/{o}/orders/{orderId}`
Same order schema as Admin Dashboard + Rider-specific fields:
| Field | Type | Rider Notes |
|---|---|---|
| `assignedRider` | string | Set during accept via transaction |
| `riderName` | string | Denormalized for display |
| `riderPhone` | string | Denormalized |
| `deliveryOTP` | string | 4-digit code |
| `arrivedAtRestaurantAt` | string | Timestamp |
| `pickedUpAt` | string | Timestamp |
| `otpVerifiedAt` | string | Timestamp |
| `paidAt` | string | Timestamp |

## Rider Location
Path: `riders/{uid}/location`
| Field | Type | Description |
|---|---|---|
| `lat` | number | GPS latitude |
| `lng` | number | GPS longitude |
| `timestamp` | number | Epoch ms |
| `heading` | number | Compass direction |
| `speed` | number | Speed in km/h |

## Ledger Entry
Path: `riders/{uid}/ledger/{txId}`
| Field | Type | Description |
|---|---|---|
| `type` | string | `"delivery"` |
| `orderId` | string | Related order |
| `outletId` | string | Outlet |
| `outletName` | string | Denormalized |
| `amount` | number | Earnings for this delivery |
| `cashCollected` | number | Cash collected from COD |
| `customerName` | string | Denormalized |
| `timestamp` | number | Epoch ms |
| `status` | string | `"completed"` |

## OTP Attempts
Path: `businesses/{b}/outlets/{o}/otpAttempts/{orderId}`
| Field | Type | Description |
|---|---|---|
| `count` | number | Attempt count |
| `lastAttemptAt` | number | Last attempt timestamp |
| `blockedUntil` | number | Blocked until timestamp |
| `verified` | boolean | Successfully verified |
| `regenerateRequestedAt` | number | Last regenerate timestamp |

## Notifications
Path: `riders/{uid}/notifications/{notifId}`
| Field | Type | Description |
|---|---|---|
| `id` | string | Notification ID |
| `title` | string | Title |
| `body` | string | Body text |
| `type` | string | `"order"`, `"system"`, `"admin"` |
| `icon` | string | Icon name |
| `timestamp` | number | Epoch ms |
| `read` | boolean | Read/unread |

## Settlement
Path: `settlements/{uid}/{settlementId}`
| Field | Type | Description |
|---|---|---|
| `amount` | number | Cash amount |
| `status` | string | `"pending"`, `"completed"` |
| `createdAt` | number | Timestamp |
| `settledAt` | number | Settlement timestamp |
