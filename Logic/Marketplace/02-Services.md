# Marketplace — Services Layer

All 12 service modules in `src/services/` handle Firebase reads/writes, data mapping, and business logic.

## Auth (`authService.ts`)
- `subscribeToAuthChanges(callback)` — Firebase `onAuthStateChanged` wrapper
- `handleRedirectResult()` — Process `getRedirectResult` on mount
- `signInWithGoogle()` — Calls `signInWithRedirect` (mobile-friendly)
- `updateProfile(updates)` — Writes to `users/{uid}/`
- `signOut()` — Firebase `signOut`

## Cart (`cartService.ts`)
- `buildCartItemId(menuItemId, customization)` — Deterministic ID from menuItemId + options hash
- `computeUnitPrice(menuItem, customization)` — Base price + size diff + addons + crust

## Config (`configService.ts`)
- Reads from `system/config/` and `system/promotions/`:
  - `platformFee/amount` — Platform fee (cached in CartContext)
  - `surge` — Surge pricing multiplier
  - `globalDiscount` — Global discount percentage
  - `coupons/{code}` — Coupon validation
- `system/platformConfig/cuisines` — Cuisine list for Home page

## Delivery (`deliveryService.ts`)
- `calcDeliveryFee(distanceKm, config)` — Supports two modes:
  - `per_100m` — distance × rate
  - `slabs` — bracket-based (upToKm → fee)
- `deliveryFeeLabel(config)` — Human-readable fee description
- `defaultDeliveryFeeConfig` — Fallback defaults

## Menu (`menuService.ts`)
- `fetchMenuItems(outletId)` — Reads `businesses/{biz}/outlets/{oid}/dishes/`
- `fetchCategories(outletId)` — Reads categories
- Maps legacy Firebase dish format to TS `MenuItem` type

## Notification (`notificationService.ts`)
- `requestNotificationPermission(userId)` — Requests FCM token, saves to `users/{userId}/fcmToken`
- `handleForegroundMessage()` — Listens for FCM messages while app is open
- FCM VAPID key noted as placeholder — not yet configured

## Order (`orderService.ts`)
- `submitOrder(input)` — Creates order in `businesses/{b}/outlets/{o}/orders/{id}`, writes audit
- `fetchOrdersFromFirebase(userId)` — Reads all orders across outlets for user
- `loadOrders()` / `persistOrders(orders)` — localStorage cache (`foodhubbie_orders` key)
- `nextStatus(current)` — Returns next status in sequence
- Order ID format: `FH-{Date.now()}-{random4}` (matches bot format)

## Outlet (`outletService.ts`)
- `fetchOutlets()` — Reads all businesses/outlets, maps to `Outlet[]`
- `fetchOutletBySlug(slug)` — Resolves `slugs/outlets/{slug}` → businessId + outletId
- `fetchOutletById(id)` — Direct ID lookup
- Calculates distance from user location, computes availability status

## Promotion (`promotionService.ts`)
- `validateCoupon(code, cartTotal, outletId)` — Checks `system/promotions/coupons/{code}`
- Returns `Coupon` object: `{ code, type, discount, minOrder, maxDiscount, description }`
- `getActivePlatformPromotions()` — Surge + global discount

## Review (`reviewService.ts`)
- `submitReview(outletId, review)` — Writes to `businesses/{b}/outlets/{o}/reviews/`
- `fetchReviews(outletId)` — Reads reviews for outlet
- Also writes rider rating: `riders/{riderId}/ratings`

## Wallet (`walletService.ts`)
- `getWalletBalance(userId)` — Reads `users/{userId}/wallet/balance`
- `addFunds(userId, amount, description)` — Adds to balance + writes history entry
- Deducts from wallet during checkout if `paymentMethod === "wallet"`
- Uses atomic-like operations (no multi-path transaction)

## Audit (`auditService.ts`)
- `logMarketplaceAudit(action, details, userId)` — Pushes to `logs/marketplaceAudit`
- Tracks: login, order placement, review submission, wallet transactions
