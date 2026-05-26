# Active View — Database Structure

## Active Order Fields
`businesses/{b}/outlets/{o}/orders/{id}`
| Field | Set By | Set At |
|---|---|---|
| `status` | Rider | Various steps |
| `arrivedAtRestaurantAt` | Rider | Step 1 complete |
| `pickedUpAt` | Rider | Step 2 complete |
| `deliveryOTP` | System | Accept time |
| `otpVerifiedAt` | Rider | OTP success |
| `paymentStatus` | Rider | Payment step |
| `paidAt` | Rider | Payment step |
| `cashCollected` | Rider | Payment step |
| `paymentMethod` | Rider | Payment step |
| `completedAt` | Rider | Finalize |

## OTP Attempts
`businesses/{b}/outlets/{o}/otpAttempts/{orderId}`
| Field | Type | Description |
|---|---|---|
| `count` | number | Attempt count (0-10) |
| `lastAttemptAt` | number | Last try timestamp |
| `blockedUntil` | number | Block expiry timestamp |
| `verified` | boolean | Success flag |
| `regenerateRequestedAt` | number | Last regenerate timestamp |

## Rider Wallet
`riders/{uid}/wallet`
| Field | Type | Description |
|---|---|---|
| `balance` | number | Current wallet (earnings - withdrawals) |
| `totalEarned` | number | Lifetime earnings |

## Ledger Entry
`riders/{uid}/ledger/{txId}`
| Field | Type | Description |
|---|---|---|
| `type` | string | `"delivery"` |
| `orderId` | string | Related order |
| `outletId` | string | Outlet ID |
| `outletName` | string | Denormalized |
| `amount` | number | Delivery earning |
| `cashCollected` | number | Cash collected |
| `customerName` | string | Denormalized |
| `customerPhone` | string | Denormalized |
| `timestamp` | number | Epoch |
| `status` | string | `"completed"` |
