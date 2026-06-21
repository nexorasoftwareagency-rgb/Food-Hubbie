# Database Structure: InventoryPage

## Raw materials — `businesses/{bid}/outlets/{oid}/inventory/{itemId}`

```json
{
  "name": "Cheddar Cheese",
  "category": "Dairy",
  "stock": 12,
  "threshold": 5,
  "unit": "kg",
  "createdAt": "2026-06-04T10:30:00.000Z",
  "updatedAt": "2026-06-04T14:15:00.000Z"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Human-readable item name, used in CSV export and audit log |
| `category` | string | no | Free-form category (e.g. "Dairy", "Vegetables", "Packaging") |
| `stock` | number | yes | Current quantity in `unit` units. Always clamped to `>= 0` |
| `threshold` | number | yes | Low-stock alert level. `stock <= threshold` triggers the banner |
| `unit` | string | no | Free-form unit ("kg", "liters", "units", "pcs"). Defaults to "units" |
| `createdAt` | ISO timestamp | yes | Set on create via `new Date().toISOString()` |
| `updatedAt` | ISO timestamp | yes | Refreshed on every stock change and edit |

## Dish stock — `businesses/{bid}/outlets/{oid}/dishes/{dishId}/stock`

Two shapes are supported:

### Boolean (most common)
```json
"stock": true
```
or
```json
"stock": false
```

### Numeric
```json
"stock": 25
```

The `MenuPage` (dish CRUD) sets the initial value; `updateStock()` in `InventoryPage`, the POS checkout, the Marketplace `orderService.submitOrder()`, and the bot's `handleFinalCheckout` all decrement it.

## Audit log — `businesses/{bid}/outlets/{oid}/logs/audit/{pushId}`

Written by every inventory mutation. The `action` field is one of:
- `inventory_create` — when a new raw material is added
- `inventory_update` — when an existing raw material is edited
- `inventory_delete` — when a raw material is removed
- `inventory_stock_toggle` — when a boolean dish's stock is toggled
- `inventory_stock_adjust` — when a numeric stock is changed (raw material OR numeric dish)

Schema:
```json
{
  "action": "inventory_stock_adjust",
  "details": {
    "itemId": "abc123",
    "itemName": "Cheddar Cheese",
    "itemType": "raw_material",
    "unit": "kg",
    "previous": 12,
    "next": 7,
    "delta": -5
  },
  "actor": { "uid": "...", "email": "...", "displayName": "..." },
  "ts": { ".sv": "timestamp" },
  "clientTs": 1717500000000
}
```

## Indexes (from `database.rules.json`)
```json
"inventory": {
  ".read": true,
  ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || auth.token.superadmin === true)",
  ".indexOn": ["category", "item"]
}
```

The `.indexOn` allows efficient queries on category and item name.
