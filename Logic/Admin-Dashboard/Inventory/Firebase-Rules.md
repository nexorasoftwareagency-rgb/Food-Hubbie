# Firebase Rules: InventoryPage

## Paths touched

| Path | Operation | Auth required |
|---|---|---|
| `businesses/{bid}/outlets/{oid}/inventory` | read | public (`.read: true`) |
| `businesses/{bid}/outlets/{oid}/inventory` | write | admin (any `admins/{uid}` record) |
| `businesses/{bid}/outlets/{oid}/dishes` | read | public (`.read: true`) |
| `businesses/{bid}/outlets/{oid}/dishes` | write | admin (any `admins/{uid}` record) |
| `businesses/{bid}/outlets/{oid}/dishes/{id}/stock` | read | public |
| `businesses/{bid}/outlets/{oid}/dishes/{id}/stock` | write | admin (any `admins/{uid}` record) |
| `businesses/{bid}/outlets/{oid}/logs/audit` | write | admin (any `admins/{uid}` record) |

## Rule snippet (from `database.rules.json`)

```json
"inventory": {
  ".read": true,
  ".write": "auth != null && (root.child('admins').child(auth.uid).exists() || auth.token.superadmin === true)",
  ".indexOn": ["category", "item"]
}
```

## Cross-app writes to inventory
- **Admin POS checkout** (POSPage.handleCheckout): `update(Outlet("dishes/{id}"), { stock: newStock })` at line ~933
- **Marketplace orderService.submitOrder()**: `update(dishRef, { stock: increment(-quantity) })` at line ~170
- **Bot whatsapp-engine.js handleFinalCheckout**: `dishRef.update({ stock: newStock, updatedAt: now })` (added)
- **Rider App**: read-only for stock display (does not write inventory)

All three apps use `Outlet("dishes/{id}")` — they are gated by the same `dishes` rules above.

## Validation
- Stock is clamped to `Math.max(0, ...)` in the client before write; the rules do not currently enforce a `>= 0` constraint on numeric stock (this could be tightened in a future rules update)
- `name` and `unit` are stored as strings; the rules do not enforce a max length
- `category` is a free-form string (no enum)
- `createdAt` and `updatedAt` are client-provided ISO timestamps (no `.validate` rule)
