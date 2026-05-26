# Promotions — Complete Flow

## User Journey
1. Admin clicks Promotions tab → initPromotions() fires
2. Three sections loaded from RTDB:

### Surge Pricing
1. Displays: enabled toggle, multiplier, threshold, start/end time
2. Admin modifies values
3. Click "Apply Surge" → btnApplySurge() writes to /system/promotions/surge

### Global Discount
1. Displays: active checkbox, type dropdown, value input
2. Values loaded from /system/promotions/globalDiscount
3. "Apply Discount" button saves changes to RTDB

### Platform Fee
1. Displays: type dropdown, value input
2. Values loaded from /system/config/platformFee
3. "Set Fee" button saves changes to RTDB

### Coupons
1. Coupon table renders via real-time listener
2. **Add**: "Add Coupon" → couponModal → fill Code*, Type, Value, MinOrder, UsageLimit → couponSave()
3. **Toggle**: Flip active switch → toggleCoupon(cid, current)
4. **Delete**: "Delete" → confirmAction → deleteCoupon(cid)
5. **Pause All**: "Pause All Coupons" → all coupons set to inactive
