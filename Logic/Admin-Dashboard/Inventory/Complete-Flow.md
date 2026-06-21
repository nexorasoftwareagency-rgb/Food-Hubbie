# Complete Flow: InventoryPage

## Flow 1: Adjust stock on an existing item

1. Admin opens Inventory page (`page === "inventory"`)
2. Two `onValue` listeners fire:
   - `businesses/{bid}/outlets/{oid}/inventory` → `setInvItems(...)`
   - `businesses/{bid}/outlets/{oid}/dishes` → `setDishItems(...)`, sets `loading = false`
3. If `invItems.length > 0`, raw materials are shown. Otherwise, dish availability is shown as a fallback.
4. The table renders with stock bars and status pills
5. Admin clicks **-1**, **+5**, or **+10** (numeric) OR **Mark Available / Unavailable** (boolean dish)
6. `updateStock(id, delta, source)` runs:
   - For boolean dish: `update(Outlet("dishes/{id}"), { stock: !cur.stock })` then `logAudit("inventory_stock_toggle", { previous, next, itemType: "dish", unit: "boolean" })`
   - For numeric dish: `update(Outlet("dishes/{id}"), { stock: newStock })` then `logAudit("inventory_stock_adjust", { previous, next, delta, itemType: "dish", unit: "count" })`
   - For raw material: `update(Outlet("inventory/{id}"), { stock: newStock })` then `logAudit("inventory_stock_adjust", { previous, next, delta, itemType: "raw_material", unit: cur.unit })`
7. The RTDB child_changed triggers the `onValue` listeners again
8. The component re-renders with the new stock value, the stock bar fills/empties, and the status pill updates
9. Success toast shown

## Flow 2: Add a new raw material

1. Admin clicks the orange **+ New Item** button in the toolbar
2. `setShowAddInv(true)` opens the Add modal
3. Admin fills in: Name (required), Category, Unit, Current Stock, Low-Stock Threshold
4. Admin clicks **Add Item**
5. `handleAddInventory(e)` runs:
   - Validates `name.trim()` is non-empty (toasts "Item name is required" if empty)
   - Clamps stock/threshold to `>= 0`
   - `push(Outlet("inventory"))` generates a new RTDB key
   - `set(newRef, { name, category, stock, threshold, unit, createdAt, updatedAt })`
   - `logAudit("inventory_create", { itemId: newRef.key, name, category, stock, threshold, unit })`
   - Closes the modal, resets the form, shows success toast
6. The new item appears in the table on next render
7. If `stock <= threshold`, the low-stock banner in the root App appears

## Flow 3: Edit an existing raw material

1. Admin clicks the ✏️ Edit icon in the Actions column of a raw material row
2. `openEditInventory(item)` runs: sets `editInvId = item.id`, pre-fills `editInvForm` from the current record, opens the Edit modal
3. Admin modifies fields and clicks **Save Changes**
4. `handleEditInventory(e)` runs:
   - Validates `name.trim()` is non-empty
   - `update(Outlet(`inventory/${editInvId}`), { name, category, stock, threshold, unit, updatedAt })`
   - `logAudit("inventory_update", { itemId, name, previous: {...}, next: {...} })`
   - Closes the modal
5. The updated record appears in the table on next render
6. The low-stock banner may appear/disappear depending on the new stock vs threshold

## Flow 4: Delete a raw material

1. Admin clicks the 🗑️ Delete icon in the Actions column of a raw material row
2. `window.confirm("Delete '...' from inventory?")` is shown
3. If confirmed, `handleDeleteInventory(item)` runs:
   - `remove(Outlet(`inventory/${item.id}`))`
   - `logAudit("inventory_delete", { itemId, name, stock, threshold, unit })`
4. The item is removed from the table on next render
5. The low-stock banner updates if the count drops to zero

## Flow 5: Low-stock banner (separate, in root App)

1. When the admin signs in and `_bizId`/`_outletId` are set, the root App component starts listening to `inventory/` and `dishes/`
2. For each inventory record: `Number(stock) || 0 <= Number(threshold) || 0 && threshold > 0` → counted
3. For each dish: boolean `false` or numeric `0` → counted
4. The max of inventory count and dish count is displayed
5. When the count > 0, a yellow banner appears at the top of every page (except login)
6. The banner has "View Inventory" (navigates to inventory page) and "X" (dismisses) buttons
7. Dismissal resets when the count changes (e.g. admin restocks an item)

## Flow 6: Export inventory to CSV

1. Admin clicks **Export CSV** in the toolbar
2. `exportInventory()` builds rows with `row, item, stock, threshold, unit, status`
3. `downloadCSV("inventory-YYYY-MM-DD.csv", rows)` triggers a browser download
4. Success toast shown
