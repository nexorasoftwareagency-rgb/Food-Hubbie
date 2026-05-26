# Active View — Complete Flow

## Trip Lifecycle (Active View)

```
1. SHOW ACTIVE TRIP
   ├─ sec-active displayed with current order data
   ├─ Rider name, address, items rendered
   ├─ Step progress: all 4 steps shown (1-4 with checkmarks)
   ├─ Step 1 active (highlighted), steps 2-4 pending
   ├─ Real-time distance to outlet displayed
   └─ Live location watchPosition running

2. STEP 1 — REACH OUTLET
   ├─ Rider arrives near outlet (≤ 1km)
   ├─ Slide-to-action enabled → drag "REACH OUTLET"
   ├─ On slide complete:
   │   ├─ Mark arrivedAtRestaurantAt = Date.now()
   │   ├─ Show #verificationModal with order items
   │   ├─ Rider checks items → tap "Items Correct"
   │   └─ Step 1 → complete (green checkmark)
   └─ If distance > 1km: "Move closer to outlet" toast

3. STEP 2 — PICK UP
   ├─ Slide-to-action: "PICK UP"
   ├─ Must be ≤ 300m from outlet
   ├─ On slide complete:
   │   ├─ Update status → "Out for Delivery"
   │   ├─ Set pickedUpAt
   │   ├─ Push to botCommands for WhatsApp notification
   │   └─ Step 2 → complete
   └─ Step 3 becomes active

4. NAVIGATION
   ├─ Rider taps "Navigate" button
   ├─ Opens Google Maps with customer address
   └─ Rider drives to customer location

5. STEP 3 — REACH DROP LOCATION
   ├─ Rider arrives near customer (≤ dropRadius)
   ├─ Slide-to-action: "REACH CUSTOMER"
   ├─ On slide complete:
   │   ├─ Update status → "Reached Drop Location"
   │   └─ Open #otpPanel
   └─ OTP input visible with 4-digit boxes

6. OTP VERIFICATION
   ├─ Customer provides 4-digit OTP
   ├─ Rider enters digits (auto-advance input)
   ├─ System checks rate limit
   ├─ If valid:
   │   ├─ Mark otpAttempts.verified = true
   │   ├─ Set otpVerifiedAt
   │   ├─ Close OTP panel
   │   ├─ Open #paymentPanel
   │   └─ Step 3 → complete
   ├─ If invalid:
   │   ├─ Show "Invalid OTP" shake animation
   │   ├─ Increment attempt count
   │   ├─ If count >= 10: block 60s, show admin bypass
   │   └─ "Regenerate OTP" option (60s cooldown)
   └─ Step 4 becomes active

7. STEP 4 — COLLECT PAYMENT
   ├─ #paymentPanel shows order total, payment method
   ├─ Rider selects: Cash or UPI
   ├─ If COD: enter cash collected amount
   ├─ Confirm payment
   └─ Close payment panel

8. FINALIZE DELIVERY
   ├─ Update status → "Delivered"
   ├─ Set completedAt, paidAt
   ├─ Create ledger entry
   ├─ Update wallet balance
   ├─ Increment riderStats
   ├─ Push to botCommands for "Delivered" WhatsApp
   ├─ Show #successOverlay with confetti
   ├─ Auto-close after 4s
   └─ Navigate to sec-available (or sec-home)
```

## Error Recovery
| Issue | Recovery |
|---|---|
| GPS lost mid-trip | Use last known location, retry every 5s |
| OTP blocked (10 fails) | "Call Admin" button for override |
| Firebase write fails | Retry with exponential backoff, queue if offline |
| Connection lost mid-slide | Revert slide, show offline state |
| Multiple active orders | Tabs at top to switch between trips |
