# Active View — Code Logics

## Purpose
Live trip view showing current delivery progress, map, step progress, and slide-to-action controls.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `window.showActiveTrip()` | View init | Render current order with progress |
| `window.reachedOutlet(step)` | Slide action | Mark arrived at restaurant |
| `window.verifyItems(bool)` | Verification modal | Confirm items correct/issue |
| `window.pickupOrder(step)` | Slide action | Mark picked up |
| `window.reachedDrop(step)` | Slide action | Mark reached customer |
| `window.startNavigation(dest)` | Button | Open Google Maps |
| `window.verifyOTP(otp)` | OTP modal | Verify delivery OTP |
| `window.collectPayment(method)` | Payment modal | Record payment |
| `window.finalizeDelivery()` | Button | Complete delivery |

## Step Progress (4 steps)
| Step # | Label | Slide Action | Proximity Gate |
|---|---|---|---|
| 1 | REACH OUTLET | ✓ ✓ REACH OUTLET | 1km |
| 2 | PICK UP | ✓ ✓ PICK UP | 300m |
| 3 | REACH DROP | ✓ ✓ REACH CUSTOMER | Drop radius |
| 4 | COMPLETE | — (OTP + Payment) | — |

## Proximity Check
```
canProceed(step):
  getDistance(riderLat, lng, targetLat, lng)
  → step 1: ≤ 1km from outlet → enable slide
  → step 2: ≤ 300m from outlet → enable slide
  → step 3: ≤ dropRadius from customer → enable slide
  → else → "Move closer to proceed" toast
```

## OTP Verification
```
verifyOTP(input):
  1. Read attempts: otpAttempts/{orderId}
  2. If blocked (blockedUntil > now) → reject + show unblock time
  3. If count ≥ 10 → block 60s → reject
  4. Match input with order.deliveryOTP
  5. Match → mark verified, open payment panel
  6. No match → increment count, show "Invalid OTP"
  7. Regenerate → if 60s cooldown passed → new 4-digit OTP
```

## Real-time Updates
- `child_changed` listener on active order — updates progress bar, customer data
- Rider location `watchPosition` — updates distance UI in real-time
- `onDisconnect` — marks rider offline if connection lost during trip
