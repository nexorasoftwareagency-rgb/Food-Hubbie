# Marketplace — Complete Flows

## End-to-End User Journey

```
1. BROWSE (Home / Search / Outlets)
   ├─ Guest lands on Home → featured outlets carousel, cuisine grid
   ├─ Search by name or cuisine → debounced results
   └─ Browse nearby outlets → sorted by distance/rating

2. SELECT OUTLET (OutletDetails)
   ├─ Slug-resolved /store/:slug or legacy /outlet/:id
   ├─ View outlet info: rating, delivery time, offers, min order
   ├─ Browse menu by category tabs
   ├─ View dish details: description, sizes, addons, crusts
   └─ Tap "Add" → ProductCustomizationModal opens

3. CUSTOMIZE & ADD TO CART
   ├─ Select size (if multiple), addons, crust, extra cheese
   ├─ Set quantity
   ├─ Tap "Add to Cart"
   ├─ CartContext detects outlet conflict:
   │   ├─ Same outlet → add/merge item
   │   └─ Different outlet → show OutletSwitchDialog
   ├─ Cart persisted to Firebase (if logged in)
   └─ FloatingCart badge updates

4. REVIEW CART (Cart)
   ├─ View all items with customization details
   ├─ Adjust quantities or remove items
   ├─ Apply coupon code
   └─ Proceed to checkout

5. CHECKOUT (Checkout)
   ├─ Delivery address:
   │   ├─ Use saved address (if logged in)
   │   ├─ Use detected location (Nominatim reverse geocode)
   │   └─ Enter manually
   ├─ Select payment method: UPI / Card / Wallet / COD
   ├─ View order summary: subtotal, delivery fee, platform fee,
   │   discounts, total
   └─ Place order → submitOrder()

6. ORDER PLACED (Tracking)
   ├─ Navigate to /tracking/{orderId}
   ├─ View real-time status: Placed → Confirmed → Preparing →
   │   Cooked → Ready → Out for Delivery → Reached Drop →
   │   Delivered
   ├─ View OTP when out for delivery
   ├─ Receive push notifications (if FCM configured)
   └─ Rate the order after delivery

7. PROFILE & HISTORY (Profile / Orders)
   ├─ View profile, edit name/phone
   ├─ Wallet balance + transaction history
   ├─ Saved addresses
   ├─ Order history (localStorage + Firebase)
   └─ Track past orders, reorder
```

## Guest vs Authenticated Flow

| Feature | Guest | Authenticated |
|---|---|---|
| Browse outlets | ✅ | ✅ |
| View menu | ✅ | ✅ |
| Add to cart | ✅ (browser only) | ✅ (persisted to Firebase) |
| Checkout | ❌ (prompted to login) | ✅ |
| Order history | ❌ | ✅ |
| Wallet | ❌ | ✅ |
| Saved addresses | ❌ | ✅ |
| Push notifications | ❌ | ✅ |

## Authentication Flow

```
1. User taps "Login" or is prompted during checkout
2. signInWithGoogle() called
3. Browser redirects to Google OAuth
4. On return: handleRedirectResult() processes result
5. AuthContext subscribes to onAuthStateChanged
6. User profile synced from users/{uid} via onValue listener
7. Cart restored from customers/{uid}/cart
8. FCM permission requested
```
