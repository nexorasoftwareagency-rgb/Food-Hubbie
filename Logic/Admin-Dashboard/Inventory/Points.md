# Points / Gotchas: InventoryPage

## Audit log on every mutation
- Stock changes (`updateStock`), creates (`handleAddInventory`), edits (`handleEditInventory`), and deletes (`handleDeleteInventory`) all call `logAudit()` from `firebase.js` (lines 122–143)
- The audit log is fire-and-forget: failures are logged to `console.warn` and never block the originating operation
- All audit entries go to `businesses/{bid}/outlets/{oid}/logs/audit/{pushId}` — SuperAdmin's Audit tab aggregates these across all outlets

## Low-stock banner (in root App component)
- A separate `onValue` listener watches both `inventory/` and `dishes/` and counts items at or below threshold
- The banner shows even when the user is on a different page (e.g. Dashboard, Orders)
- The banner can be dismissed via the X button; dismissal resets when the count changes
- The "View Inventory" button navigates to the inventory page via `setPage("inventory")`
- Items with `stock === undefined` (dishes without a stock field) are not counted as low/out

## No BOM (Bill of Materials)
- Selling a dish does NOT automatically consume raw materials — dishes and raw materials are independent
- Future work: a `recipes` map on each dish pointing to the raw materials it consumes; auto-deduct via a Cloud Function on order write
- Until then, raw materials are manually maintained by the kitchen team

## Boolean vs numeric dish stock
- Dishes with `stock: true` are "in stock" (available); `stock: false` means "out of stock"
- Dishes with numeric `stock: N` track a count (e.g. 25 portions of pizza)
- The same dish CANNOT have both shapes at the same time (last write wins)
- The page renders "✅" / "❌" for boolean dishes and a numeric value + stock bar for numeric dishes

## Dish fallback behavior
- If `inventory/` is empty (no raw materials configured), the page shows dish availability instead
- The toolbar text indicates which mode is active: "No raw-materials inventory found — showing dish availability" vs "Showing raw materials from N record(s)"
- In dish-fallback mode, the Edit and Delete buttons do NOT appear (dishes are managed via MenuPage)

## Stock bar width math
- `Math.min(100, numericStock / (threshold * 2 || 1) * 100)` — the bar fills to 100% when stock reaches `threshold × 2`
- Example: `threshold = 5` → bar is full at `stock = 10`
- This is a "buffer" visualization, not an absolute max
- For boolean dishes, the bar is either 100% (available) or 5% (unavailable)

## CSV export columns
- `row` (1-indexed)
- `item` (item name)
- `stock` (numeric value, or "available" / "unavailable" for boolean dishes)
- `threshold` (raw materials only; empty for dishes)
- `unit` (raw materials only; empty for dishes)
- `status` (`"ok"` if available, `"out"` otherwise)

## Performance
- The page re-renders on every inventory/dishes change. For large catalogs (1000+ dishes), consider debouncing or virtualizing
- The two `onValue` listeners are cleaned up via `off()` in the effect's return
- The low-stock banner listener in the root App component is the same — both are independent listeners
