# Code-Logics: InventoryPage

**Location**: `admin-dashboard/src/App.jsx` lines 1801–2150 (InventoryPage function)

## Props
- `{ showToast }`

## State
- `invItems` — array of raw material records from `businesses/{bid}/outlets/{oid}/inventory` (live `onValue` listener)
- `dishItems` — array of dish records from `businesses/{bid}/outlets/{oid}/dishes` (live `onValue` listener, fallback when inventory is empty)
- `loading` — set false after first snapshot arrives
- `showAddInv` — boolean, controls "Add Item" modal visibility
- `addInvForm` — `{ name, category, stock, threshold, unit }` for the create modal
- `addInvBusy` — disables submit while writing
- `editInvId` — non-null when editing an existing item; holds the item's RTDB key
- `editInvForm` — same shape as `addInvForm` for the edit modal
- `editInvBusy` — disables submit while writing

## Computed / Derived
- `items` — `invItems.length > 0 ? invItems : dishItems` (inventory takes precedence; dishes are a fallback)
- `usingDishes` — `true` when no raw materials are configured
- `itemIsAvailable(item)` — returns `true` if:
  - `item.source === "dish"` and `item.stockType === "boolean"` → `item.stock === true`
  - `item.source === "dish"` and numeric stock → `(Number(item.stock) || 0) > 0`
  - `item.source === "inventory"` → `stockStatus(stock, threshold) === "ok"`
- `low` — count of items not available but still have stock > 0 (e.g. below threshold)
- `critical` — count of items at zero stock or marked unavailable (boolean false)
- `stockStatus(stock, threshold)` — `"critical" | "low" | "ok"` based on stock vs threshold
- Stock bar width: `Math.min(100, numericStock / (threshold * 2 || 1) * 100)` — threshold × 2 is 100% bar fill
- Status colors: `ok=#22c55e (green)`, `low=#f59e0b (orange)`, `critical=#ef4444 (red)`

## Handlers

### `updateStock(id, delta, source)`
- Dish (boolean): toggles `dishes/{id}/stock` between `true`/`false`
- Dish (numeric): applies delta clamped to `Math.max(0, ...)`; writes `dishes/{id}/stock`
- Raw material: applies delta clamped; writes `inventory/{id}/stock`
- **Audit log**: `logAudit(bizId, outletId, action, details, actor)` writes to `businesses/{bid}/outlets/{oid}/logs/audit`
  - `action`: `"inventory_stock_toggle"` (boolean dish) or `"inventory_stock_adjust"` (numeric/raw)
  - `details`: `{ itemId, itemName, itemType, unit, previous, next, delta }`

### `handleAddInventory(e)`
- Validates `name` (required, non-empty)
- Clamps stock/threshold to `Math.max(0, ...)`
- `push(Outlet("inventory"))` to generate a new RTDB key
- `set(newRef, { name, category, stock, threshold, unit, createdAt, updatedAt })`
- Audit: `action: "inventory_create"` with full payload
- Closes modal, resets form, toasts success/error

### `openEditInventory(item)`
- Sets `editInvId` and pre-fills `editInvForm` from the existing record
- Opens edit modal

### `handleEditInventory(e)`
- Validates `name` (required)
- `update(Outlet(`inventory/${editInvId}`), { name, category, stock, threshold, unit, updatedAt })`
- Audit: `action: "inventory_update"` with `previous` and `next` snapshot for diff
- Closes modal, toasts success/error

### `handleDeleteInventory(item)`
- Confirms via `window.confirm()`
- `remove(Outlet(`inventory/${item.id}`))`
- Audit: `action: "inventory_delete"` with full record snapshot
- Toasts success/error

### `exportInventory()`
- Generates CSV download with columns: `row, item, stock, threshold, unit, status`
- Boolean dishes render as `"available"` / `"unavailable"` in the stock column
- File name: `inventory-YYYY-MM-DD.csv`

## Renders

### Toolbar
- Status text: "No raw-materials inventory found — showing dish availability" or "Showing raw materials from N record(s)"
- **Export CSV** button (white, ghost)
- **+ New Item** button (orange) — opens add modal

### 3 KPICards
- Total Items
- Unavailable (critical count)
- Low Stock (or "Out of Stock (dishes)" when using dish fallback)

### Table columns
| Column | Content |
|---|---|
| Item | Item name |
| Category | For dishes: dish category; for raw materials: unit (e.g. "kg") |
| Stock | Numeric value or "✅"/"❌" icon for boolean; stock bar fill (colored by status) |
| Status | Pill: "in stock" / "out of stock" / "critical" / "low" / "ok" |
| Actions | -1 / +5 / +10 (numeric) OR Mark Available/Unavailable (boolean). For raw materials: also Edit (✏️) and Delete (🗑️) icons |

### Add Inventory Modal
- Form: Name (required), Category, Unit, Current Stock, Low-Stock Threshold
- Submit: `Add Item` (orange) or `Saving…` while busy
- Cancel: closes modal, resets form

### Edit Inventory Modal
- Same form as Add, pre-filled with current values
- Submit: `Save Changes` (orange) or `Saving…` while busy
- Cancel: closes modal
