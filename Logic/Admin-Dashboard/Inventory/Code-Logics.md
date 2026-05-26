# Code-Logics: InventoryPage

**Location**: App.jsx lines 1815-1897

## Props
- `{ showToast }`

## State
- `items` — initialized from `MOCK_INVENTORY`, each item enriched with computed `stockStatus(i.stock, i.threshold)` that returns `"critical"`, `"low"`, or `"ok"`

## Computed / Derived
- `stockStatus(stock, threshold)` — determines status based on stock vs threshold
- Stock bar width: `Math.min(100, (item.stock / item.threshold) * 100)` — percentage fill relative to threshold

## Handlers
- `updateStock(id, delta)` — clamps stock to `Math.max(0, ...)`, recomputes `stockStatus`
- `exportInventory()` — generates CSV download with columns: item, stock, threshold, status, unit

## Renders
- **3 KPICards**: Total Items, Low Stock count, Out of Stock count
- **Table**: item name, stock bar (colored by status), threshold, status badge (colored via `statusColors`), action buttons (-1 / +5 / +10)
- `statusColors = { ok: "#22c55e" (green), low: "#f59e0b" (orange), critical: "#ef4444" (red) }`
