# Rider App — Complete Flows

## Full Delivery Lifecycle

```
1. ONLINE
   ├─ Rider logs in → onAuthStateChanged → load profile
   ├─ Init location tracking (10s GPS interval)
   ├─ Init order listener (child_added on orders)
   ├─ Init notification listener
   ├─ Set onDisconnect → offline
   └─ Show sec-home dashboard with today's stats

2. NEW ORDER PING
   ├─ child_added fires for order with status="Placed" and !assignedRider
   ├─ Play alert.mp3 + vibrate
   ├─ Show #newOrderPingModal with:
   │   ├─ Customer name, address, items, delivery fee
   │   └─ 30-second countdown timer
   ├─ Rider taps ACCEPT:
   │   ├─ Proximity check: distance ≤ 1km from outlet
   │   ├─ Firebase transaction: assign rider to order
   │   ├─ Generate 4-digit delivery OTP
   │   ├─ Update order.status → "Confirmed" (or stays "Placed"?)
   │   ├─ Push to botCommands for WhatsApp notification
   │   ├─ Hide ping modal, switch to sec-active
   │   └─ Update rider status → "busy"
   ├─ Rider taps SKIP (or timeout):
   │   ├─ Close ping modal
   │   └─ Return to sec-available / sec-home
   └─ If offline → queue ACCEPT_ORDER action

3. REACH OUTLET (Step 1 of 4)
   ├─ sec-active view shows step progress (ACCEPTED → PICKUP → TRANSIT → DROP)
   ├─ Rider arrives at outlet (GPS within 1km)
   ├─ Slide-to-action: "REACH OUTLET"
   ├─ Proximity gate: must be ≤ 1km
   ├─ Update order.arrivedAtRestaurantAt
   ├─ Show #verificationModal with order items checklist
   ├─ Rider verifies items → tap "Items Correct" or "Issue"

4. PICKUP (Step 2 of 4)
   ├─ Slide-to-action: "PICK UP" (300m proximity gate)
   ├─ Update order.status → "Out for Delivery"
   ├─ Update order.pickedUpAt
   └─ Push to botCommands for "Out for Delivery" WhatsApp message

5. NAVIGATE TO CUSTOMER
   ├─ Tap "Navigate" button
   ├─ Open Google Maps: https://www.google.com/maps?q=lat,lng
   ├─ Real-time location continues tracking
   ├─ Order status updates monitored via child_changed
   └─ Route optimization button (if ≥ 2 active orders)

6. REACHED DROP LOCATION (Step 3 of 4)
   ├─ Slide-to-action: "REACH CUSTOMER"
   ├─ Proximity gate: within configurable drop radius
   ├─ Update order.status → "Reached Drop Location"
   ├─ Open #otpPanel for delivery verification
   ├─ Push to botCommands for "Reached" WhatsApp message

7. OTP VERIFICATION
   ├─ Customer provides 4-digit code
   ├─ Rider enters OTP in #otpPanel
   ├─ System checks:
   │   ├─ Rate limit: max 10 attempts, 60s block
   │   └─ Match: input === order.deliveryOTP
   ├─ On success:
   │   ├─ Mark otpAttempts.verified = true
   │   ├─ Open #paymentPanel
   │   └─ Push to botCommands with OTP (for admin)
   ├─ On failure:
   │   ├─ Increment attempt count
   │   ├─ Show error toast
   │   ├─ If ≥ 10 → block for 60s, show admin override option
   │   └─ "Regenerate OTP" button (60s cooldown)

8. PAYMENT COLLECTION (Step 4 of 4)
   ├─ #paymentPanel shows:
   │   ├─ Order total
   │   ├─ Payment method: Cash or UPI
   │   └─ Cash collected amount (if COD)
   ├─ Rider selects/confirms payment
   ├─ Update order.paymentStatus → "Collected"
   └─ Proceed to finalize

9. FINALIZE DELIVERY
   ├─ Update order.status → "Delivered"
   ├─ Update order.paidAt, order.otpVerifiedAt
   ├─ Create ledger entry: riders/{uid}/ledger/{txId}
   ├─ Update wallet: riders/{uid}/wallet
   ├─ Update riderStats
   ├─ Fire confetti animation
   ├─ Show #successOverlay with delivery summary
   ├─ Auto-close after 4 seconds
   └─ Push to botCommands for "Delivered" WhatsApp message

10. COMPLETE
    ├─ Order moves to sec-completed (trip history)
    ├─ Earnings added to sec-ledger (wallet) and sec-earnings (stats)
    ├─ Rider status → "online" (available for next ping)
    └─ Return to sec-available for next order
```

## Sidebar Navigation
```
Open sidebar →
  ├─ Dashboard (sec-home)
  ├─ Pickup (sec-available)
  ├─ Live Trip (sec-active) — only if active order
  ├─ Trip History (sec-completed)
  ├─ Ledger (sec-ledger)
  ├─ Reports (sec-earnings)
  ├─ Profile (sec-profile)
  ├─ Install App (PWA prompt)
  └─ Logout
```
