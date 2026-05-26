# Admin Dashboard — Code Logics

## Architecture Overview

- **Monolithic SPA** — All 19 page components defined inline in `App.jsx` (~2790 lines), no React Router
- **Dual structure** — `sections/` directory has equivalent modular exports with proper Firebase hooks, but App.jsx does NOT import them (except POS.jsx and Menu.jsx use `useRealtimeData` hook)
- **State management** — React `useState` / `useEffect` only; no Redux/Context beyond auth
- **Styling** — Inline styles + `App.css` sheet classes + Tailwind via `index.css` (`@import "tailwindcss"`)
- **Build** — `npx vite build` from `admin-dashboard/`

## Auth Flow

1. `onAuthStateChanged` in App root sets `user` / `authLoading`
2. Login: `signInWithEmailAndPassword(auth, email, password)` on orange gradient login screen
3. After auth: reads `admins/{user.uid}` from Firebase to get `businessId`, `outletId`, `outletName`, `outletAddress`
4. Sets module-level globals `_bizId`, `_outletId` and calls `setOutletContext(bizId, outletId)`
5. `Outlet(path)` function creates scoped ref: `ref(db, "businesses/{bizId}/outlets/{outletId}/{path}")`

## Database Scoping

**All data is scoped per-outlet** under:
```
businesses/{businessId}/outlets/{outletId}/
```

Collections under each outlet:
- `orders/` — Order records with status, items, pricing, rider assignment
- `dishes/` — Menu items with name, category, price, stock, sizes, addons
- `categories/` — Category definitions with image, display order, addons
- `customers/` — Customer profiles keyed by phone
- `settings/Store/` — Store info, addresses, social links, hours
- `settings/Delivery/` — Delivery config, fee slabs, phone numbers

Top-level nodes:
- `riders/{riderId}` — Rider profiles shared across outlets
- `admins/{uid}` — Admin-to-outlet mapping

## Key Helpers (defined inline in App.jsx)

| Function | Purpose |
|---|---|
| `fmt(v)` | Formats number as ₹XX,XXX (Indian locale) |
| `esc(t)` | HTML entity escape for receipt printing |
| `csvValue(v)` | Wraps value in quotes for CSV |
| `downloadCSV(filename, rows)` | Generates CSV blob download |
| `orderItemsCount(order)` | Counts items regardless of format (cart[], items{}, scalar) |
| `orderItemsText(order)` | Human-readable items text |
| `validateGSTIN(g)` | Validates GSTIN format (15 chars) |
| `validateFSSAI(f)` | Validates 14-digit FSSAI |
| `validateCoords(lat,lng)` | Validates lat(-90/90)/lng(-180/180) ranges |

## Constants

- `ORD_ST` — 9 order status definitions with label/color/bg
- `ORDER_STATUSES` — Alternative 7-status map
- `SEQ` — Sequential status array: Placed → Confirmed → Preparing → Cooked → Ready → Out for Delivery → Reached Drop Location → Delivered (+ Cancelled)
- `LIVE_ST` — Statuses considered active/live
- `PIE_COLORS` — 6 chart colors
- `ORANGE = "#f36b21"` — Brand color

## Shared Inline Components

All defined in `App.jsx` lines 164-252: KPICard, StarRating, Pill, ToggleSwitch, EmptyState, SectionHeader, StatusBadge, GlassCard, BtnPrimary, BtnSecondary, Modal, Toast, Avatar, Loading, Input, Select, StatCard, SectionLabel

## Navigation

- `NAV_GROUPS` — 5 groups: Main (Dashboard/Orders/Live Ops/Kitchen), Sales (POS/Menu/Categories), Data (Inventory/Customers/Riders/Partners), Insights (Analytics/Lost Sales/Settlements), Tools (Notifications/Feedback/Live Tracker/Settings)
- `MOBILE_NAV` — Bottom nav: Home, Orders, POS, Menu, Settings
- `PAGE_TITLES` — Human-readable page title map
- `PAGES` — Object mapping page IDs to inline component references
- Page state persisted in localStorage key `foodhubbie-admin-page`

## Sidebar

- Desktop: fixed left sidebar with NAV_GROUPS, collapse toggle, dark mode toggle, logout
- Mobile: hamburger toggle, overlay backdrop when open
- Collapsed state persisted in localStorage key `foodhubbie-admin-sidebar-collapsed`
- `Outlet Info` card shown when not collapsed (name + address)

## Theme

- Dark mode toggle stored in localStorage key `foodhubbie-admin-theme`
- Affects background (`bg`), sidebar (`sideBg`), text (`textCol`) style vars
- Toggle button at bottom of sidebar

## Toast System

- `showToast(msg, type)` sets toast state with 3.5s auto-dismiss via `setTimeout`
- Types: `"success"` (green), `"error"` (red), `"warning"` (orange)
- Rendered at bottom-center of layout

## Outlet Helper (module-level)

```js
let _bizId = null, _outletId = null;
function Outlet(path) {
  return _bizId && _outletId
    ? ref(db, `businesses/${_bizId}/outlets/${_outletId}/${path}`)
    : null;
}
```

Set when admin profile loads after auth.

## Order Validation (Orders page, LiveOpsPage)

- `updateStatus(id, status)` validates sequential flow via `SEQ.indexOf`
- Rider must be assigned before advancing to "Out for Delivery"
- Delivered orders cannot be cancelled
- Status update writes `{ status, paymentStatus }` to Firebase

## Rider Assignment

- `assignRider(orderId, riderId)` fetches rider from `riders/{riderId}`, writes `{ riderId, assignedRider, riderName, riderPhone, assignedAt }` to order node

## POS Stock Logic

- Only dishes with `stock > 0` shown in POS grid
- `handleCheckout` validates stock for each item via fresh Firebase read
- After order saved, decrements stock per dish via `update(Outlet("dishes/{id}"), { stock: current - qty })`
- Auto-migration: `useEffect` detects `typeof stock === "boolean"` → writes `{ stock: 0, threshold: 5 }` to Firebase

## POS Cart

- Cart keyed by composite key: `{dishId}::{sizeName}::{sortedAddonKeys}` (triple-colon delimited)
- Edit cart: click row → `openEditCartItem(key, item)` → finds dish from `dishes[]` state → pre-fills modal → `addToCart` removes old entry via `editKey` then adds new
- Quantities: +/- buttons in cart (clamped to min 1); Trash2 icon to remove
- Tax: hardcoded 5% on `(subtotal - discount) * 0.05`
- Discount clamped: `Math.max(0, Math.min(100, val))`; reset to 0 on clearCart
- Phone validation: `^[0-9]{10}$` (stripped non-digits), blank allowed
- Order type: radio buttons for Dine-in / Takeaway

## POS Order Creation

- Order ID format: `YYYYMMDD-NNNN` (date-based, from `metadata/orderSequence`), not `ORD-XXX`
- Initial status set to `"Confirmed"` (bypasses "Placed" for counter sales)
- Receipt opens as `data:text/html` URL in new window with `onload="window.print()"`, not document.write
- Order saved via `set()` (not `push()`) to `orders/{orderId}`
- Stock validation fetches all dishes fresh from Firebase before checkout

## Keyboard Shortcuts (POS)

- `useEffect` with `keydown` listener when `selModal` is truthy
- `Escape` closes modal + clears `editKey`
- `Enter` calls `addToCart()`
- `useRef` used for `addToCart` to avoid re-attaching effect

## Live Tracker

- Dynamically imports Leaflet map library
- Listens to `riders` for online riders and their locations
- Managed map markers for each rider
- Falls back gracefully if Leaflet unavailable

## Settings Validation

- `validateCoords` before saving store settings
- `validateGSTIN` and `validateFSSAI` with error toasts
- Delivery fee slabs managed as array of `{ km, fee }`

## Monolithic vs Modular

- App.jsx inline pages use real Firebase via global `_bizId`/`_outletId` + `Outlet()` helper
- `sections/` files use standalone hooks (`useRealtimeData`) and imported components
- Only `sections/POS.jsx` and `sections/Menu.jsx` connect to Firebase; rest use mock data
- `components/` folder has 13 reusable components used by sections/ files

## File Locations

- `admin-dashboard/src/App.jsx` — Monolithic app with all pages
- `admin-dashboard/src/firebase.js` — Firebase init, `Outlet()`, `setOutletContext()`, upload helpers
- `admin-dashboard/src/main.jsx` — Entry point
- `admin-dashboard/src/index.css` — Tailwind import
- `admin-dashboard/src/App.css` — All custom styles
- `admin-dashboard/src/sections/*.jsx` — Modular page components (not imported by App.jsx)
- `admin-dashboard/src/components/*.jsx` — Shared UI components
- `admin-dashboard/src/hooks/useRealtimeData.js` — Firebase hook
- `admin-dashboard/src/utils/constants.js` — Constants, status defs, color palette
- `admin-dashboard/src/utils/formatters.js` — fmt(), cn(), escapeHtml(), haptic()
- `admin-dashboard/src/utils/validators.js` — Validation helpers
