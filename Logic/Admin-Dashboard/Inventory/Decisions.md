# Decisions: InventoryPage

## Why hybrid (raw materials + dish fallback)
Some tenants have raw-material inventory (`Outlet("inventory")`), others only have dish-level stock (`Outlet("dishes/{id}/stock)`). The page supports both:
- If raw materials exist, show them as the primary view
- If no raw materials exist, fall back to dish availability (boolean + numeric)
- This avoids forcing every tenant to set up raw materials just to track dish availability

## Audit log
Every stock change is logged to `businesses/{bid}/outlets/{oid}/logs/audit` with `inventory_stock_toggle`, `inventory_stock_adjust`, `inventory_create`, `inventory_update`, or `inventory_delete` actions. This addresses the original "no audit log" gap from the v1 placeholder.

## Low-stock banner
A separate listener in the root `App` component watches both `inventory/` and `dishes/` and shows a dismissible banner when items are at or below threshold. The banner has a "View Inventory" CTA that navigates the user to this page. This addresses the "no reorder/alert" gap.

## Add/Edit/Delete raw materials
Previously only stock could be adjusted on existing items. Now admins can create, edit, and delete raw materials with full audit trail. Edit/Delete are scoped to raw materials only (not dishes) — dish CRUD is handled by `MenuPage`.

## Stock bar uses threshold × 2 as 100%
The bar fills up to `threshold × 2` units (not the absolute max stock). This gives visual feedback on how close an item is to its low-stock alert level rather than the upper bound (which can be unbounded for some items).

## Design choices
- **-1 / +5 / +10 buttons** — common kitchen inventory adjustment amounts, no custom input needed
- **Boolean dishes** — `stock: true|false` is a separate shape from numeric raw materials; the page handles both
- **Form validation** — name is the only required field; stock/threshold clamp to non-negative integers
- **Audit on create/update/delete** — every mutation emits `inventory_create` / `inventory_update` / `inventory_delete` to `logs/audit` with full payload
- **No BOM (Bill of Materials) link** — raw materials and dishes are independent entities; no automatic consumption of raw materials when a dish is sold
