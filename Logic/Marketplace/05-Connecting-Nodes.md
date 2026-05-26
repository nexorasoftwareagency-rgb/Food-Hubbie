# Marketplace — Connecting Nodes

## Provider Dependency Chain
```
AuthProvider          ← Required by: CartProvider, OrderProvider
  └─ LocationProvider ← Required by: OutletDetails, Checkout (distance calc)
      └─ OrderProvider ← Required by: Tracking, Orders, Checkout
          └─ CartProvider ← Required by: Cart, Checkout, OutletDetails
```

## Data Flow Pattern

### Page → Context → Service → Firebase
```
[Page Component]
  ↓ usesContext()
[Context Provider]    ← AuthContext, CartContext, OrderContext
  ↓ calls
[Service Layer]       ← authService, cartService, orderService, etc.
  ↓ reads/writes
[Firebase RTDB]       ← Realtime Database
```

### Example: Add to Cart Flow
```
OutletDetails page
  → useCart().dispatch({ type: "ADD_ITEM", payload: item })
  → cartReducer handles outlet-conflict check
  → CartProvider useEffect persists to Firebase:
    `customers/{user.id}/cart` via `set(cartRef, data)`
  → On login: CartProvider restores from Firebase:
    `get(cartRef)` → dispatch({ type: "SYNC_FROM_DB" })
```

### Example: Place Order Flow
```
Checkout page
  → useOrderContext().placeOrder(input)
  → orderService.submitOrder(input)
    → Generate ID: FH-{Date.now()}-{random4}
    → Write to: businesses/{biz}/outlets/{oid}/orders/{orderId}
    → Write audit: logs/marketplaceAudit
    → Clear persisted cart
  → OrderContext updates state
  → Navigate to /tracking/{orderId}
```

## Route → Page → Data Dependencies

| Route | Page | Data Source | Contexts Used |
|---|---|---|---|
| `/` | Home | outletService.fetchOutlets() + configService | Location, Auth |
| `/search` | Search | outletService + menuService | Location |
| `/outlets` | Outlets | outletService.fetchOutlets() | Location |
| `/store/:slug` | OutletDetails | outletService.fetchOutletBySlug() + menuService | Cart, Auth |
| `/cart` | Cart | CartContext (state.items) | Cart |
| `/checkout` | Checkout | CartContext + orderService + locationService | Cart, Order, Location, Auth |
| `/tracking/:id` | Tracking | OrderContext.getOrderById() | Order |
| `/profile` | Profile | AuthContext.user + walletService | Auth |
| `/orders` | Orders | OrderContext.orders (localStorage + Firebase) | Order |
| `/login` | Login | authService.signInWithGoogle() | Auth |

## localStorage Cache
- **Key**: `foodhubbie_orders`
- **Purpose**: Offline access to order history
- **Sync**: Written after every Firebase fetch; seeded from localStorage on mount
- **No server-side cache**: All reads go directly to Firebase RTDB
