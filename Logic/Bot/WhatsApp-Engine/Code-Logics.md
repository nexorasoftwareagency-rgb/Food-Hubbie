# WhatsApp Engine (whatsapp-engine.js) — Code Logics

## Overview
Full interactive ordering state machine with Global Discovery mode. Handles the entire customer ordering flow via WhatsApp chat.

## Dependencies
- `./firebase` — getData, setData, updateData, pushData, saveUserProfile, getUserProfile, getGlobalData, BUSINESS_ID, OUTLET_ID, db
- `../shared/utils` — formatJid, isShopOpen, calculateDistance, calculateDeliveryFee, generateOTP
- `./audit` — logBotAudit

## Session Management
| Variable | Type | Description |
|---|---|---|
| `sessionCache` | `Map<string, {data, expiry}>` | In-memory session cache with TTL |
| `SESSION_TTL_MS` | 30 min | Cache expiry |

- `getCachedSession(jid)` — returns session or null if expired
- `setCachedSession(jid, data)` — stores with expiry
- `getSession(jid)` — cache-first, fallback to Firebase `system/botSessions/{bid}/{oid}/{safeJid}`
- `persistSession(jid, session)` — writes to Firebase + updates cache
- Periodic cleanup every 10 min evicts expired entries

## Session Schema
```js
{
  step: 'START',          // Current state machine step
  cart: [],               // Array of { name, size, unitPrice, addons, quantity, total, outletId }
  current: {},            // { dish, size, unitPrice, addons } — in-progress selection
  activeOutlet: null,     // Selected outlet ID (null for global discovery)
  activeBid: null,        // Selected business ID
  lastActivity: Date.now(),
  profile: null,          // Saved user profile (phone-based)
  name: null,             // Name from current order
  phone: null,            // Phone from current order
  address: null,          // Address from current order
  location: null,         // { lat, lng }
  deliveryFee: null,      // Calculated delivery fee
  categoryList: [],       // Categories for current outlet
  dishList: [],           // Dishes for current category
  sizeList: [],           // Sizes for current dish
  discoveryCategories: [],// Categories across nearby outlets
  categoryMap: {},        // { CategoryName: [{bid, oid, name, dist}] }
  discoveryList: []       // Sorted nearby outlets
}
```

## State Machine Steps

### `START` → `handleStart()`
- If `OUTLET_ID === 'GLOBAL'` and no `activeOutlet`:
  - Set step = `DISCOVERY_LOCATION`
  - Ask user to share location or browse online
- Else (single outlet mode): `showMenu()`

### `DISCOVERY_LOCATION` → `handleDiscoveryLocation()`
- Requires WhatsApp location message
- Scan all businesses/outlets within 10km (Haversine)
- Aggregate categories across nearby outlets
- Show category list for selection

### `DISCOVERY_CATEGORY` → `handleDiscoveryCategorySelection()`
- User picks category number → shows outlets sorted by distance

### `SELECT_OUTLET` → `handleOutletSelection()`
- User picks outlet number → sets `activeOutlet`, `activeBid`
- Calls `showMenu()` for that outlet

### `CATEGORY` → `handleCategorySelection()`
- Shows categories for current outlet
- `9` → view cart, `0` → change shop (global mode)
- Selecting category → fetches dishes + inventory, filters by category + available

### `DISH` → `handleDishSelection()`
- Shows dishes in category with sold-out markers
- `9` → cart, `0` → back to categories
- Selecting dish → shows size options

### `SIZE` → `handleSizeSelection()`
- Shows sizes with prices
- If sizes not defined, shows "Regular" with dish.price
- `0` → back

### `QUANTITY` → `handleQuantitySelection()`
- Validates: 1-50, must be integer
- Adds to cart with `{ name, size, unitPrice, addons, quantity, total, outletId }`
- Shows cart view

### `CART_VIEW` → `handleCartAction()`
- Shows cart with subtotal
- Options: 1=Add More, 2=Checkout, 3=Clear Cart, 0=Back
- If profile exists → ask reuse (step=REUSE_PROFILE)
- Else → start collection (step=COLLECT_NAME)

### `REUSE_PROFILE` → `handleReuseProfile()`
- 1=Use saved → skip to location request
- 2=Enter new → COLLECT_NAME

### `COLLECT_NAME` → `handleNameCollection()`
- Saves name → COLLECT_PHONE

### `COLLECT_PHONE` → `handlePhoneCollection()`
- Validates 10-digit (strips non-digits)
- Saves phone → COLLECT_ADDRESS

### `COLLECT_ADDRESS` → `handleAddressCollection()`
- Saves address → LOCATION (share location)

### `LOCATION` → `handleLocationReceived()`
- Requires WhatsApp location
- Calculates delivery fee via outlet slabs (fallback to global defaults)
- Shows order summary with subtotal, delivery fee, total
- Step = CONFIRM_PAY

### `CONFIRM_PAY` → `handleFinalCheckout()`
- 1=Confirm → Create order in Firebase, save user profile, send success message, log audit
- 2=Cancel → back to menu
- Order ID format: `FH-{timestamp}-{random4digit}`
- Order saved to `businesses/{bid}/outlets/{oid}/orders/{orderId}`
- Payment: Cash on Delivery only

## Helpers
- `showMenu(sock, jid, user)` — checks shop hours, loads categories, displays menu with banner image
- `sendCartView(sock, jid, user, isAdded)` — renders cart content with action buttons
- `sendImage(sock, jid, image, text)` — sends image with caption, falls back to text-only
- `sendLocationRequest(sock, jid, user)` — asks user to share live location

## Input Validation
- Max 1000 characters
- Strips control characters (unicode categories C0, C1, DEL)
- Supports both `conversation` and `extendedTextMessage` message types
- `reset` or `menu` text resets session to START
