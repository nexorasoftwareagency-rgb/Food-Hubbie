# Shared Components — Database Structure

See `D:\Foodhubbie\Logic\Admin-Dashboard\04-Database-Structure.md` for the full schema.

## Root Nodes

### `admins/{uid}`
Admin-to-outlet mapping record:

| Field | Type | Description |
|---|---|---|
| `businessId` | string | Business identifier |
| `outletId` | string | Outlet identifier |
| `outletName` | string | Display name |
| `outletAddress` | string | Address for receipts |

### `businesses/{businessId}/outlets/{outletId}/`
All outlet-scoped data:

#### `orders/{orderId}/`
Complete order record with customer info, cart items, pricing, status, rider assignment, timestamps.

#### `dishes/{dishId}/`
Menu item with name, price, category, image, stock, sizes, addons, veg/best flags.

#### `categories/{categoryId}/`
Category with name, image, display order, category-level addons.

#### `customers/{phone}/`
Aggregated customer profiles from order history.

#### `settings/Store/`
Business entity name, address, GSTIN, FSSAI, store hours, social links, location coordinates, WiFi credentials.

#### `settings/Delivery/`
Developer contact, report phone, backup code, delivery fee slabs.

#### `metadata/`
Outlet-level counters: `orderSequence` (incremented for each POS order).

### `riders/{riderId}`
Shared across all outlets: rider name, phone, email, vehicle, status, live location, earnings, deliveries, rating, zone, join date.
