# OrderContext — Overview

## Purpose
Manages order lifecycle including placement, status tracking, and localStorage persistence.

## State
| Field | Type | Description |
|---|---|---|
| `orders` | `Order[]` | All user orders (cached + Firebase) |
| `currentOrder` | `Order \| null` | Most recently placed order |

## Key Functions
| Function | Description |
|---|---|
| `placeOrder(input)` | Calls `orderService.submitOrder()`; adds to state + localStorage |
| `updateOrderStatus(id, status)` | Updates status + statusHistory; persists |
| `advanceOrderStatus(id)` | Calls `nextStatus()` then `updateOrderStatus()` |
| `markOrderAsReviewed(id)` | Sets `isReviewed: true` |
| `getOrderById(id)` | Finds order in local state |

## Internal Logic
- **Initialization**: `loadOrders()` seeds state from localStorage on mount
- **Firebase sync**: When authenticated, `fetchOrdersFromFirebase(userId)` fetches all orders across outlets; writes result to localStorage
- **Persistence**: `persistOrders()` writes to `localStorage` key `foodhubbie_orders`
- **Guest → Authenticated transition**: Clears stale localStorage orders; re-fetches from Firebase
- **Placement flow**: Clear cart → navigate to tracking

## Order Status Sequence (from orderService)
```
Placed → Confirmed → Preparing → Cooked → Ready → Out for Delivery → Reached Drop Location → Delivered
```

## Points
- `localStorage` is the single source of truth for UI; Firebase is the canonical store
- No real-time listener on individual orders — relies on `fetchOrdersFromFirebase()` which is a one-time read
- `advanceOrderStatus()` is a convenience for demo/testing (not used in production flow)
- `currentOrder` is set during `placeOrder()` for immediate redirect to tracking
- `markOrderAsReviewed()` only updates local state + localStorage — does NOT write to Firebase
