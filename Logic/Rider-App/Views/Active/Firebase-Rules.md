# Active View — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{b}/outlets/{o}/orders/{id}` | Read order details |
| `businesses/{b}/outlets/{o}/settings/Delivery` | Read proximity radii |
| `riders/{uid}/location` | Read own location |
| `businesses/{b}/outlets/{o}/otpAttempts/{orderId}` | Read OTP attempt state |

## Paths Written
| Path | When |
|---|---|
| `businesses/{b}/outlets/{o}/orders/{id}/status` | Status update |
| `businesses/{b}/outlets/{o}/orders/{id}/arrivedAtRestaurantAt` | Step 1 |
| `businesses/{b}/outlets/{o}/orders/{id}/pickedUpAt` | Step 2 |
| `businesses/{b}/outlets/{o}/orders/{id}/otpVerifiedAt` | OTP success |
| `businesses/{b}/outlets/{o}/orders/{id}/paidAt` | Payment |
| `businesses/{b}/outlets/{o}/orders/{id}/paymentStatus` | Payment |
| `businesses/{b}/outlets/{o}/orders/{id}/status` | "Delivered" |
| `businesses/{b}/outlets/{o}/otpAttempts/{orderId}` | OTP attempt count |
| `businesses/{b}/outlets/{o}/otpAttempts/{orderId}/verified` | OTP success |
| `businesses/{b}/outlets/{o}/otpAttempts/{orderId}/blockedUntil` | Block on 10 fails |
| `businesses/{b}/outlets/{o}/botCommands` | WhatsApp notification |
| `riders/{uid}/wallet` | Wallet update on finalize |
| `riders/{uid}/ledger/{txId}` | Ledger entry |
| `riderStats/{uid}/today` | Daily stat increment |

## OTP Attempts Rule
```json
{
  "otpAttempts": {
    "$orderId": {
      "count": { ".validate": "newData.isNumber() && newData.val() <= 10" },
      "blockedUntil": { ".validate": "newData.isNumber()" },
      "verified": { ".validate": "newData.isBoolean()" }
    }
  }
}
```
