# Promotions — Code Logics

## Initialization
- initPromotions() reads 3 data sources:
  1. /system/promotions/surge
  2. /system/promotions/globalDiscount
  3. /system/config/platformFee
- Calls loadCoupons() for coupon listener

## Surge Pricing
- Read: multiplier, threshold, startTime, endTime, enabled
- btnApplySurge() writes to /system/promotions/surge
- Input controls: multiplier (number), threshold (number), start/end time (time picker)

## Global Discount (BROKEN)
- Read: active (checkbox), type (dropdown: percentage/flat), value (number)
- btnApplyDiscount exists in HTML but has **NO event handler** attached in app.js
- Discount cannot be saved or updated
- Default display: active checkbox checked if data.active !== false

## Platform Fee (BROKEN)
- Read: type (dropdown: fixed/percentage), value (number)
- btnSetPlatformFee exists in HTML but has **NO event handler** attached in app.js
- Platform fee cannot be saved or updated

## Coupons CRUD

### loadCoupons()
- Real-time listener on /system/promotions/coupons
- Renders coupon table with: Code, Type, Value, Min Order, Usage Limit, Active, Actions

### Create Coupon
- couponModal opens with empty fields: Code*, Type, Value, MinOrder, UsageLimit
- couponSave():
  - Validates code is non-empty
  - Pushes new coupon to /system/promotions/coupons
  - Sets active: true by default

### Toggle Coupon
- toggleCoupon(cid, currentActive):
  - Flips /system/promotions/coupons/{cid}/active to !currentActive

### Delete Coupon
- confirmAction → deleteCoupon(cid):
  - Removes /system/promotions/coupons/{cid}

### Pause All Coupons
- btnPauseAllCoupons():
  - Iterates all coupons
  - Sets each coupon's active to false
