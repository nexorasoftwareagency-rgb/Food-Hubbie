# Cart Page — Code Logics

## Overview
Cart review page with item management, coupon application, and checkout progression.

## State
| Variable | Source | Description |
|---|---|---|
| `outlet` | `fetchOutletById(state.outletId)` | Current outlet info |
| `couponInput` | local | Coupon code text input |
| `appliedCoupon` | CartContext | From `state.appliedCoupon` |

## Key Logic
- **Free delivery threshold**: ₹499 (Zomato-style milestone)
  - `FREE_DELIVERY_THRESHOLD = 499`
  - Progress bar: `freeProgress = (subtotal / 499) * 100`
  - `neededForFree = max(0, 499 - subtotal)`
- **Projected cashback**: 2% of (subtotal - couponDiscount)
- **Coupon validation**: Calls `validateCoupon(code)` from promotionService
  - Checks `minOrder` threshold before applying
  - Handles `percent` and `freeship` coupon types
- **Summary**: `calcCartSummary(items, outlet, { couponDiscount, platformFee, isFreeDelivery })`

## Views
- Empty cart state → prompt to browse
- Cart items list with quantity +/- controls and remove button
- Coupon section with input + apply button
- Bill breakdown: Subtotal, Delivery Fee, Platform Fee, Coupon Discount, Total
- "Place Order" button → navigates to `/checkout`

## Decisions
- Free delivery milestone at ₹499 encourages cart filling
- Projected cashback (2%) gamifies ordering
- Coupon codes validated client-side against promotionService
- Outlet name and logo shown for context
