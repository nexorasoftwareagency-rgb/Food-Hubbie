# Promotions — Points

## Key Implementation Details
- Surge pricing fully functional with real-time save
- Coupons fully functional with create/toggle/delete/pause-all
- Global discount and platform fee are display-only (no save handlers)

## Known Issues
1. ~~**HIGH**: btnApplyDiscount — exists in HTML, no event handler in app.js~~ **FIXED**
2. ~~**HIGH**: btnSetPlatformFee — exists in HTML, no event handler in app.js~~ **FIXED**
3. **MEDIUM**: Coupon code uniqueness not enforced (duplicate codes allowed)
4. **LOW**: discountActive defaults to checked (newData.active !== false means undefined = true)

## Gotchas
- No validation on surge multiplier (can be 0 or negative)
- Coupon usageLimit is stored but not decremented anywhere visible
- No coupon expiry date field
- No minimum order validation feedback in UI
- Pause All sets all to false — no way to restore previous state
- Surge time comparison uses string comparison (HH:MM) — may not compare correctly across midnight
- Platform fee type "fixed" means ₹ amount, "percentage" means % of order
