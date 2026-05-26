# Cart Page — Points

## Edge Cases
- **Empty cart** → "Your cart is empty" with "Browse Restaurants" CTA
- **Outlet not found** → outlet name fallback to empty string
- **Coupon minOrder not met** → alert message, coupon not applied
- **Invalid coupon code** → alert "Invalid or expired coupon"
- **Item quantity → 0** → item auto-removed by CartContext reducer

## Gotchas
- Free delivery threshold (₹499) is hardcoded — not configurable from Firebase
- Cashback projection (2%) is hardcoded — not from any config
- Coupon validation happens before checkout — re-validated on Checkout page
- No max quantity limit enforcement here (handled in ProductCustomizationModal: 1-50)
- Guest users see cart but cannot proceed to checkout (redirected to login)

## Future Improvements
- Make free delivery threshold configurable per-outlet or system-wide
- Make cashback percentage configurable
- Add bulk edit mode (select multiple items to remove)
- Add "Save for later" feature
