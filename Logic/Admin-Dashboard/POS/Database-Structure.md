# POS — Database Structure

See `D:\Foodhubbie\Logic\Admin-Dashboard\04-Database-Structure.md` for the full schema.

## Key Paths Used by POS

### `businesses/{businessId}/outlets/{outletId}/dishes/{dishId}`
Menu items displayed in the POS dish grid. Only dishes with `(stock || 0) > 0` are shown.

| Key fields | Description |
|---|---|
| `name` | Dish name |
| `price` | Base price |
| `sizes` | Object of size→price mappings (e.g. `{"Small": 100, "Medium": 150}`) |
| `addons` | Object of addon→price mappings |
| `stock` | Available quantity |
| `category` | Category ID reference |
| `image` | Image URL |
| `veg`, `best` | Boolean flags |

### `businesses/{businessId}/outlets/{outletId}/categories/{catId}`
Used for category filter pills. Category-level `addons` inherited by dishes.

### `businesses/{businessId}/outlets/{outletId}/orders/{orderId}`
Created by POS with status `"Confirmed"`. Contains customer info, cart array, pricing, payment method, order type, notes, outlet address.

### `businesses/{businessId}/outlets/{outletId}/metadata/orderSequence`
Single numeric value, incremented atomically on each POS sale. Used to generate order IDs in format `YYYYMMDD-NNNN`.
