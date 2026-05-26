# POS — Code Logics

## POSPage (`App.jsx` lines 813–1110)

### Imports
- **lucide-react**: Search, Minus, Plus, Trash2, and others
- **recharts**: none used in POS
- Firebase helpers from `./firebase`

### Props
`{ showToast, outletInfo }`

### State
| State | Type | Default | Description |
|---|---|---|---|
| `dishes` | array | `[]` | Available dishes (stock > 0) |
| `cats` | array | `[]` | Categories |
| `catFilter` | string | `"All"` | Active category filter |
| `search` | string | `""` | Search query |
| `cart` | object | `{}` | Cart keyed by composite key |
| `custName` | string | `""` | Customer name |
| `custPhone` | string | `""` | Customer phone |
| `discount` | number | `0` | Discount percentage |
| `payMethod` | string | `"Cash"` | Payment method |
| `orderType` | string | `"Dine-in"` | Order type |
| `orderNotes` | string | `""` | Order notes |
| `selModal` | object/null | `null` | Dish being configured in modal |
| `selSize` | string | `""` | Selected size |
| `selAddons` | object | `{}` | Selected addons |
| `selQty` | number | `1` | Selected quantity |
| `editKey` | string/null | `null` | Cart key being edited |
| `loading` | boolean | `false` | Checkout loading |

### Effects

**Dishes & Categories** — `onValue(Outlet("dishes"))` → dishes filtered to `(d.stock||0)>0`; `onValue(Outlet("categories"))` → cats

**Keyboard Listener** — when `selModal` is truthy: `Escape` closes modal + clears editKey, `Enter` calls `addToCart()` via `useRef`

### Computed Values
- **`filtered`** — memoized based on `catFilter` + `search`
- **`cartItems`** — derived from `cart` object
- **`subtotal`** — sum of item price × qty
- **`discVal`** — `subtotal * (discount / 100)`
- **`taxVal`** — `(subtotal - discVal) * 0.05`
- **`total`** — `Math.max(0, subtotal - discVal + taxVal)` (clamped to prevent negative)

### Handlers

#### `openSelection(dish)`
Opens modal, defaults to first size or `"Standard"`, clears addons, sets qty = 1.

#### `openEditCartItem(key, item)`
Finds dish from `dishes[]`, opens modal pre-filled with existing size/addons/qty. If dish not found, shows toast "Original dish no longer available".

#### `addToCart()`
- Builds composite key: `` `${dishId}::${size}::${sortedAddonKeys}` ``
- Builds price: base = `sizes[selSize] ?? dish.price ?? 0`, addonTotal = sum of `selAddons` values
- If `editKey` set: deletes old cart entry first
- Merges qty with existing entry or adds new

#### `updateCartQty(key, delta)`
Clamps to min 1: `Math.max(1, qty + delta)`. Never removes via `-` button.

#### `removeFromCart(key)`
Deletes key from cart object.

#### `clearCart()`
Resets: `cart{}`, `discount:0`, `custName""`, `custPhone""`, `orderNotes""`, `orderType"Dine-in"`. Does **not** reset `payMethod`.

#### `handleCheckout()`
1. Validate cart not empty → toast error
2. Validate phone (if filled): strip non-digits, check 10 digits
3. Validate `_outletId` exists → toast error
4. Show loading state
5. Fetch ALL dishes fresh via `get(Outlet("dishes"))` — validates each cart item against current stock
6. Generate orderId: reads `metadata/orderSequence`, increments, formats as `` `${YYYYMMDD}-${NNNN}` ``
7. Compute pricing: subtotal, discVal, taxVal (5%), total
8. Build orderData with status `"Confirmed"`, no server timestamp
9. Firebase writes: `set` order, `update` orderSequence, `update` each dish stock (clamped to `max(0, fresh - qty)`)
10. Print receipt via `window.open("data:text/html,...", "_blank")` with `onload="window.print()"`
11. Toast "Sale #ID completed!", then `clearCart()`, then remove loading in `finally` block

### Render Structure
- **Left panel**: dish grid — category pills, search, cards with image/name/price/stock badge
- **Right panel**: 360px cart sidebar — customer info, order type, notes, cart items, totals, payment method, Record Sale + Clear All buttons
- **Selection modal**: size grid, addons, qty selector, Add to Cart button

### Receipt HTML
- Customer name, order ID, order type, outlet address (if available)
- Items table: `qty × name (size) + line total`
- Tax (5%) line, total line
- **No** discount line, **no** payment method, **no** thank you message
- Opens with `window.print()` on load — user must manually close the tab
