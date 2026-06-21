# Shared Components — Code Logics

## firebase.js (`D:\Foodhubbie\admin-dashboard\src\firebase.js`)

### Exports
- `app`, `db`, `auth`, `storage` — initialized Firebase instances
- `setOutletContext(businessId, outletId)` — sets module-level `_currentBusinessId`, `_currentOutletId`

### Functions
- **`Outlet(path)`** — returns `ref(db, "businesses/{_currentBusinessId}/outlets/{_currentOutletId}/{path}")`
- **`getOutletRef(path)`** — alias for Outlet
- **`uploadImage(file, storagePath)`** — uploads file to Firebase Storage, returns download URL
- **`deleteImage(url)`** — deletes from Storage (silently catches errors)

### Re-exports
All Firebase RTDB functions (`ref`, `onValue`, `set`, `update`, `push`, `remove`, `get`, `child`), Auth functions (`signInWithEmailAndPassword`, `signOut`, `onAuthStateChanged`), Storage ref / `getDownloadURL`

### Config
- Project: `food-hubbie`
- Database URL: `food-hubbie-default-rtdb`

---

## Inline Shared Components (`App.jsx` lines 164–252)

| Component | Props | Description |
|---|---|---|
| `KPICard` | `{ title, value, sub, icon:Icon, color=ORANGE }` | Glass card with title, icon, big value, subtitle |
| `StarRating` | `{ rating }` | 5 stars, filled/empty based on `round(rating)` |
| `Pill` | `{ label, active, onClick }` | Toggle pill (orange when active) |
| `ToggleSwitch` | `{ checked, onChange }` | iOS-style 36×20px toggle |
| `EmptyState` | `{ icon:Icon, msg }` | Centered icon + message |
| `SectionHeader` | `{ title, action }` | Bold title with optional action element |
| `StatusBadge` | `{ status }` | Colored pill from ORD_ST or ORDER_STATUSES map |
| `GlassCard` | `{ children, className="", style }` | Frosted glass with blur, 16px radius, orange-tinted border |
| `BtnPrimary` | `{ children, onClick, disabled, type="button", className="" }` | Orange gradient button |
| `BtnSecondary` | `{ children, style, onClick }` | Bordered white button |
| `Modal` | `{ children, open, onClose, wide }` | Overlay modal, max-w 500 or 700 if wide, 20px radius, 24px padding |
| `Toast` | `{ msg, type, onClose }` | Fixed bottom-center, green (success), red (error), blue (info) |
| `Avatar` | `{ name, size=32 }` | Circular gradient avatar with initials |
| `Loading` | — | Spinner + "Loading..." |
| `Input` | `(p)` | Styled input 10px 14px padding, 10px radius, light bg |
| `Select` | `{ children, ...p }` | Styled select same as Input |
| `StatCard` | `{ label, value, icon:Icon, color, bg, sub }` | Glass card KPI stat |
| `SectionLabel` | `{ children }` | Uppercase label 11px |

---

## Module-Level Helpers (`App.jsx` lines 16–57)

### Constants
- **`ORANGE = "#E84908"`**, `COLORS` object
- **`ORD_ST`** — 9 order statuses
- **`ORDER_STATUSES`** — 7 order statuses
- **`SEQ`** array — status transition sequence
- **`LIVE_ST`** array — live order statuses

### Utility Functions
- **`fmt(v)`** — Indian locale formatting: `₹XX,XXX`
- **`esc(t)`** — HTML entity escape
- **`csvValue(value)`** — wraps in quotes for CSV
- **`downloadCSV(filename, rows)`** — blob download
- **`orderItemsCount(order)`** — handles `cart[]` / `items{}` / scalar formats
- **`orderItemsText(order)`** — human-readable items text
- **`validateGSTIN(g)`** — GSTIN regex 15 chars
- **`validateFSSAI(f)`** — 14-digit check
- **`validateCoords(lat,lng)`** — lat -90/90, lng -180/180

---

## Navigation (`App.jsx` lines 255–263)

- **`NAV_GROUPS`** — 5 groups: Main, Sales, Data, Insights, Tools (18 nav items total)
- **`MOBILE_NAV`** — 5 items: Home, Orders, POS, Menu, Settings
- **`PAGE_TITLES`** — 18 page name mappings
- **`PAGES`** — object mapping page IDs to inline components
- **`STORAGE_KEYS`** — localStorage keys for page, theme, sidebar

### Persistence
- Page selection, dark mode, sidebar collapsed all saved to `localStorage`

---

## Auth Flow (`App.jsx` lines 2594–2708)

- `onAuthStateChanged` → user / authLoading state
- **Login**: `signInWithEmailAndPassword` on orange gradient screen with GlassCard
- **After auth**: reads `admins/{user.uid}` → `_bizId`, `_outletId`, calls `setOutletContext()`, sets `outletInfo` state
- **Module-level globals**: `let _bizId=null, _outletId=null; function Outlet(path) {...}`
- **Loading state**: logo + spinner animation
- **Logout**: `signOut(auth)`, reset user/outletInfo

---

## Theme
- Dark mode toggled via sidebar button, stored in localStorage
- Affects `--bg`, `--sideBg`, `--textCol` CSS style vars

---

## Toast
- `showToast(msg, type)` with 3.5s auto-dismiss `setTimeout`

---

## External Module Files

### `utils/constants.js`
ORANGE, COLORS, PIE_COLORS, ORDER_STATUSES, statusColors, stockStatus(), STATUS_FLOW, SETTINGS_PATHS

### `utils/formatters.js`
fmt(), cn() class joiner, escapeHtml(), haptic()

### `utils/validators.js`
validateCoords(), validatePhone(), validateGSTIN(), validateFSSAI(), validateBackupCode()

### `hooks/useRealtimeData.js`
- `useRealtimeData(path)` — returns `{data, loading, error}`
- `useRealtimeObject(path)` — returns `{data, loading, error}`
- `firebaseGet(path)` — returns promise of value
- All use `Outlet(path)` internally

### `components/` (13 files)
Avatar, BtnPrimary, EmptyState, GlassCard, KPICard, Modal, Pill, SearchInput, SectionHeader, StarRating, StatusBadge, Toast, ToggleSwitch — each exported with same props as inline versions
