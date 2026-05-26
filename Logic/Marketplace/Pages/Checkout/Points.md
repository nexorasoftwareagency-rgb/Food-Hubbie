# Checkout Page — Points

## Edge Cases
- **Guest user** → Google sign-in wall; cannot proceed without auth
- **Empty cart** → redirected back to cart or home
- **Wallet balance insufficient** → fallback to another payment method
- **Dine-in selected** → address fields hidden; table number shown
- **Takeaway selected** → address fields hidden; pickup time shown
- **Surge pricing active** → multiplier applied to delivery fee or total
- **Coupon expired between Cart and Checkout** → re-validation catches it
- **Firebase write fails** → error toast; order not placed; cart preserved

## Gotchas
- No `window.confirm` before placing — one-tap order placement
- Promotions fetch is not cached — re-fetched on every Checkout mount
- Surge multiplier hardcoded to affect delivery fee (or total — depends on `calcCartSummary`)
- Wallet deduction is not atomic — race condition possible on rapid orders

## Future Improvements
- Add order confirmation dialog before final submit
- Add saved cards / UPI IDs for faster checkout
- Add tipping option for riders
- Add scheduled delivery time slot selection
- Implement atomic wallet transactions (multi-path update or transaction)
