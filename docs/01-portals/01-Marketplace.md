# Marketplace Portal — React 19 / TypeScript PWA

**URL**: `foodhubbie-marketplace.web.app`  
**Stack**: React 19 + TypeScript 5.9 + Vite 6 + Tailwind 4 + wouter (hash router)  
**Source**: `Marketplace/src/`  
**Hosting target**: `marketplace` → `Marketplace/dist`

---

## 1. Code-Logics

### App Structure

```
src/main.tsx -> App.tsx (providers + router)
  providers stack:
    QueryClientProvider (TanStack React Query)
      ErrorBoundary
        AuthProvider
          LocationProvider
            OrderProvider
              CartProvider
                TooltipProvider
                  WouterRouter (hash-based)
                    Router -> Switch with 11 routes
```

### Page Routes (wouter)

| Path | Component | Key features |
|---|---|---|
| `/` | Home | Hero, static grid (no real API fetch) |
| `/search` | Search | Search input + outlet results |
| `/outlets` | Outlets | Grid of outlet cards |
| `/store/:slug` | OutletDetails | Slug-based SaaS route — menu by category, cart inline |
| `/outlet/:id` | OutletDetails | Legacy ID-based fallback |
| `/cart` | Cart | Items list, quantity controls, coupon input, delivery fee calc |
| `/checkout` | Checkout | Delivery form, payment method, order summary, place order |
| `/tracking/:orderId` | Tracking | Real-time order status, live map (Leaflet) |
| `/profile` | Profile | Wallet balance, recent transactions, saved addresses |
| `/orders` | Orders | Order history from localStorage |
| `/login` | Login | Google Sign-In (popup + redirect fallback) |

### 4 Contexts
| Context | State | Firebase binding |
|---|---|---|
| AuthContext | user, authState ("loading"\|"authenticated"\|"unauthenticated"), initAuth | onAuthStateChanged + redirect result |
| CartContext | items[], outletId, appliedCoupon, fulfillmentMethod | Persists to Firebase under users/{uid}/cart |
| LocationContext | location, permission status | navigator.geolocation |
| OrderContext | orders[], loadOrders, persistOrders | localStorage (not Firebase) |

### 12 Services
| Service | Key methods | RTDB path |
|---|---|---|
| `authService.ts` | signInWithGoogle, subscribeToAuthChanges, signOut | users/{uid} |
| `orderService.ts` (366L) | submitOrder, STATUS_PIPELINE (8-step), statusIndex | businesses/{bid}/outlets/{oid}/orders |
| `cartService.ts` (125L) | calcCartSummary (GST 5%, platform fee, coupon/surge/global discount) | — (pure logic) |
| `menuService.ts` | fetchMenuByOutlet (4-path waterfall fallback) | businesses/{bid}/outlets/{oid}/dishes |
| `outletService.ts` | fetchOutlets, fetchOutletBySlug | businesses/{bid}/outlets/{oid}/meta |
| `deliveryService.ts` | calculateFee, getSlabs | businesses/{bid}/outlets/{oid}/settings/Delivery |
| `walletService.ts` | getWalletData, debitWallet, creditWallet | users/{uid}/wallet |
| `notificationService.ts` | requestPermission, getFCMToken, onForegroundMessage | FCM + local state |
| `promotionService.ts` | validateCoupon, getSurgeMultiplier | system/promotions |
| `reviewService.ts` | submitReview, getReviews | businesses/{bid}/outlets/{oid}/reviews |
| `auditService.ts` | logMarketplaceAudit | logs/marketplaceAudit |
| `configService.ts` | getPlatformConfig | system/config |

---

## 2. Firebase-Rules

| Path | Read | Write | Notes |
|---|---|---|---|
| `businesses/{bid}` | true (public) | superadmin only | Discovery |
| `businesses/{bid}/outlets/{oid}/orders` | true (public) | new data: auth (!data.exists()). Updates: admin or assigned rider | Create-only for customers |
| `businesses/{bid}/outlets/{oid}/dishes` | true (public) | admin auth | Menu items |
| `businesses/{bid}/outlets/{oid}/reviews` | true (public) | auth != null | Customer feedback |
| `users/{uid}` | self + superadmin | self + superadmin | Auth profile |
| `logs/marketplaceAudit` | auth | auth != null **(CRIT-3 fixed)** | Audit trail |
| `system/promotions` | auth | superadmin | Coupon validation |

---

## 3. Database-Structure

Order document (full schema):
```
businesses/{bid}/outlets/{oid}/orders/{pushId}
  orderId: string           (e.g. "20260603-0001")
  businessId: string        (e.g. "business_roshani")
  outletId: string          (e.g. "outlet_pizza")
  outletName: string
  status: OrderStatus       (9-value enum)
  customerName: string
  phone: string
  address: string
  lat, lng: number
  items: Array<{ menuItemId, name, image, quantity, price, size, addons[] }>
  subtotal, deliveryFee, total, discount, couponCode, couponDiscount: number
  paymentMethod: "cod"|"upi"|"card"|"wallet"
  fulfillmentMethod: "delivery"|"dinein"|"takeaway"
  createdAt, updatedAt: ISO string
  estimatedMinutes: number
```

---

## 4. Connecting-Nodes

```
[Customer taps "PAY" on Checkout.tsx]
  |
  v
cartService.calcCartSummary() -- pure math (subtotal, GST, delivery fee, discounts)
  |
  v
orderService.submitOrder():
  1. Validate businessId + outletId (throws if empty)
  2. Fetch commission config: businesses/{bid}/commission
  3. push() to businesses/{bid}/outlets/{oid}/orders/{pushId}
  4. If wallet payment: walletService.debitWallet()
  5. If coupon: system/promotions/coupons/{code}.usedCount += 1
  6. logMarketplaceAudit('ORDER_PLACED')
  |
  v
RTDB child_added triggers:
  -> Admin Dashboard onValue listener (updates KOT)
  -> Bot status-monitor (sends WhatsApp to customer)
```

---

## 5. Complete-Flows

**Checkout → Delivered** (happy path):
1. Customer selects items → Cart (address form, coupon code)
2. Taps PAY → `handlePlaceOrder` in Checkout.tsx
3. State check: `authState !== "authenticated"` → redirect to `/login`
4. Form validation (name, phone regex, address)
5. `submitOrder()` writes to Firebase → order status: "Placed"
6. Admin Dashboard live-listener receives order → KOT prints
7. Admin advances status: Confirmed → Preparing → Cooked → Ready
8. Rider accepts order → status: "Out for Delivery"
9. Tracking page shows real-time updates via `onValue` listener
10. Rider completes delivery → status: "Delivered"
11. Customer sees status update on refresh
