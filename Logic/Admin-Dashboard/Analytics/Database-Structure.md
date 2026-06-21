# Database Structure: AnalyticsPage

The Analytics page is **read-only** — it subscribes to existing nodes but never writes.

## Nodes read

### `Outlet("orders")` — e.g. `outlets/{outletId}/orders/`
- All orders for the current outlet (and all sub-outlets if hierarchical)
- Read: every `createdAt`, `status`, `total`, `cart[]` (or `items{}`), `userId`/`uid`/`phone`, `customerName`/`name`
- Filtering happens client-side via `aggregateByDay` / `aggregateByHour` / `aggregateByDish` / `aggregateByCustomer`
- Status values used: `"delivered"` (revenue counted), `"cancelled" | "canceled"` (cancel rate)

### `riders/`
- Global list (not outlet-scoped)
- Read: `name`, `vehicle`, `status`, `deliv` (deliveries count), `earn` (earnings), `rating`
- Normalized via `normalizeRider(r)`

### `Outlet("dishes")` — e.g. `outlets/{outletId}/dishes/`
- Used for `category` lookup in `aggregateByCategory`
- Read: each dish's `category` field
- Joined to cart items via `i.id` or `i.menuItemId`

## Nodes NOT touched
- No writes from Analytics page
- No reads of: `users/`, `inventory/`, `payouts/`, `coupons/`, `settings/`

## Indexing recommendation
- For outlets with >10k orders, consider adding `.indexOn: "createdAt"` on the orders node so we can do server-side `query(orderByChild("createdAt"), startAt(...))` instead of client-side filtering. Currently we pull all orders and filter in JS — fine for most shops.

## Related docs
- `Logic/Admin-Dashboard/Orders/Database-Structure.md` — orders schema
- `Logic/Admin-Dashboard/Menu/Database-Structure.md` — dishes/category schema
- `docs/03-foundation/03-Database-Security-Rules.md` — read rules for these nodes
