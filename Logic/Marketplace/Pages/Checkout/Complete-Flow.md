# Checkout Page — Complete Flow

## User Journey

```
1. User navigates to /checkout (from Cart page)
2. Auth check:
   ├─ Not authenticated → "Login to continue" with Google sign-in button
   └─ Authenticated → proceed
3. Fetch outlet details, surge config, global discount
4. Render checkout form:
   ├─ Fulfillment method selector (Delivery / Dine-in / Takeaway)
   ├─ Delivery Address:
   │   ├─ Pre-filled from saved addresses or detected location
   │   ├─ Editable name, phone, address, landmark
   │   └─ Coordinates synced from LocationContext
   ├─ (if Dine-in) Table number input
   ├─ (if Takeaway) Pickup time input
   ├─ Payment method selector (UPI / Card / Wallet / COD)
   ├─ (if Wallet) Show balance and option to use
   ├─ Order summary:
   │   ├─ Item list, Subtotal, Delivery Fee, Platform Fee
   │   ├─ Surge charge (if active)
   │   ├─ Coupon / Global discounts
   │   └─ Total
   └─ "Place Order" button
5. On submit:
   ├─ Set isProcessing = true
   ├─ Build PlaceOrderInput from form + cart state
   ├─ placeOrder(input):
   │   ├─ Submit to orderService
   │   ├─ Write to Firebase: businesses/{b}/outlets/{o}/orders/{id}
   │   ├─ Write audit log
   │   ├─ Deduct wallet (if wallet payment)
   │   ├─ Clear persisted cart
   │   └─ Return orderId
   ├─ Navigate to /tracking/{orderId}
   └─ Show success toast
6. On error → show error toast; cart preserved for retry
```
