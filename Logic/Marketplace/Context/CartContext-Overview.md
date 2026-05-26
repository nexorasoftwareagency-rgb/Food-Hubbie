# CartContext — Overview

## Purpose
Manages cart state with `useReducer` — supports multi-outlet conflict detection, Firebase persistence, and coupon management.

## State Shape
```ts
{
  items: CartItem[],
  outletId: string | null,
  pendingItem: CartItem | null,    // for outlet-switch confirmation
  appliedCoupon: Coupon | null
}
```

## Actions (reducer)
| Action | Description |
|---|---|
| `ADD_ITEM` | Adds item; detects outlet conflict → sets `pendingItem` |
| `REMOVE_ITEM` | Removes by id; clears `outletId` if cart empties |
| `UPDATE_QUANTITY` | Updates qty; removes item if qty ≤ 0 |
| `CLEAR_CART` | Resets to initial state |
| `SET_PENDING` | Sets outlet-switch pending item |
| `CONFIRM_SWITCH_OUTLET` | Clears cart and adds pending item from new outlet |
| `SYNC_FROM_DB` | Restores cart from Firebase (on login) |
| `APPLY_COUPON` | Stores applied coupon |
| `REMOVE_COUPON` | Clears applied coupon |

## Derived Values
| Value | Calculation |
|---|---|
| `total` | `items.reduce((s, i) => s + i.price * i.quantity, 0)` |
| `itemCount` | `items.reduce((s, i) => s + i.quantity, 0)` |
| `platformFee` | Fetched from `system/config/platformFee/amount` (default 5) |

## Internal Effects
1. **Fetch platform fee** on mount from `system/config/platformFee/amount`
2. **Restore cart** from `customers/{userId}/cart` when user authenticates
3. **Persist cart** to `customers/{userId}/cart` on every state change (debounced via effect comparison)

## OutletSwitchDialog
Modal shown when user adds item from a different outlet. Two buttons:
- "Keep Cart" → discard pending item
- "Start Fresh" → clear cart, add item from new outlet

## Points
- `isSyncingFromDB` ref prevents feedback loop (restore → persist → restore)
- `isInitialMount` ref prevents unnecessary initial persist
- Cart persistence only works for authenticated users
- Guest users have in-memory cart only (lost on refresh)
- `buildCartItemId()` creates deterministic IDs from menuItemId + customization hash
