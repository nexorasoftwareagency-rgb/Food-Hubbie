# Cart Page — Complete Flow

## User Journey

```
1. User navigates to /cart (via nav or FloatingCart)
2. CartContext provides state.items, state.outletId, dispatch
3. fetchOutletById(outletId) → outlet header info
4. Render cart items with +/- quantity controls and remove buttons
5. If subtotal < ₹499:
   ├─ Show progress bar: "Add ₹X more for free delivery"
   └─ deliveryFee shown in breakdown
   If subtotal ≥ ₹499:
   └─ deliveryFee = 0, "Free delivery unlocked!"
6. Coupon section:
   ├─ Enter code → tap "Apply"
   ├─ validateCoupon(code) → check minOrder
   ├─ On success: dispatch APPLY_COUPON, update summary
   └─ On failure: alert with error
7. Bill breakdown (recalculated on every change):
   ├─ Subtotal, Delivery Fee, Platform Fee
   ├─ Coupon Discount, Global Discount (if applicable)
   └─ Total
8. "Place Order" button → navigate to /checkout
   ├─ If not logged in → redirect to /login first
   └─ If cart empty → disabled
```
