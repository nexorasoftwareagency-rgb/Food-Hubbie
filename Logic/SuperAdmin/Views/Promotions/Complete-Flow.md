# Promotions Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Promotions Center" tab
2. loadPromotions() called:
   ├─ Read system/promotions/surge (once)
   ├─ Read system/promotions/globalDiscount (once)
   ├─ Read system/promotions/coupons (once)
   ├─ Read system/config/platformFee (once)
   ├─ Pre-fill surge inputs, update status badge
   ├─ Pre-fill discount inputs, update status badge
   ├─ Pre-fill fee input, update status badge
   ├─ renderCoupons(): build coupon table
   └─ lucide.createIcons()
```

## Surge Save Flow
```
1. Admin adjusts multiplier, enters reason
2. Taps "Apply"
3. saveSurge():
   ├─ Read #surgeMultiplier, #surgeReason
   ├─ db.ref('system/promotions/surge').set({
   │     multiplier: parseFloat(val),
   │     reason: reason,
   │     active: multiplier > 1.0,
   │     updatedAt: Date.now()
   │   })
   └─ showToast("Surge applied")
```

## Coupon Create Flow
```
1. Admin taps "Generate Code" → show coupon modal
2. Admin fills: code, type (% or ₹), value, min order, max usage
3. Taps "Save"
4. saveCoupon():
   ├─ checkRateLimit('CREATE_COUPON')
   ├─ If rate limited → showToast("Please wait")
   ├─ db.ref('system/promotions/coupons/{code}').set({...})
   ├─ logAdminAction('COUPON_CREATED', { code })
   └─ showToast("Coupon created")
```

## Coupon Toggle/Delete Flow
```
1. Toggle: toggleCoupon(code):
   ├─ Read current active state
   ├─ Update: coupons/{code}/active = !current
   └─ Re-render row

2. Delete: deleteCoupon(code):
   ├─ SweetAlert2 confirm
   ├─ db.ref('system/promotions/coupons/{code}').remove()
   └─ showToast("Coupon deleted")
```

## Bulk Pause Flow
```
1. Admin taps "Pause All"
2. bulkOperation('pause'):
   ├─ checkRateLimit('BULK_OPERATION')
   ├─ Iterate all coupons → set active = false
   ├─ logAdminAction('COUPONS_BULK_PAUSE')
   └─ showToast("All coupons paused")
```
