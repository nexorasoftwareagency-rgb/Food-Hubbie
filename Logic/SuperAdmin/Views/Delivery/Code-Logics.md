# Delivery Tab — Code Logics

## Purpose
Global delivery fee configuration — choose between per-100m or slab-based pricing, manage slabs.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadGlobalDelivery()` | Tab load | Read delivery config from Firebase |
| `setDeliveryMode(mode)` | Radio toggle | Switch between per_100m / slabs |
| `addDeliverySlab()` | Add button | Add empty row to slab table |
| `renderDeliverySlabs()` | Data ready | Render inline-editable slab rows |
| `saveGlobalDelivery()` | Save button | Persist delivery config to Firebase |

## Data Source
`system/settings/delivery`
| Field | Type | Description |
|---|---|---|
| `mode` | string | `per_100m` or `slabs` |
| `per100mRate` | number | Rate per 100m |
| `slabs` | array | `[{ maxKm, cost }]` |

## Mode Views
```
per_100m mode:
  ├─ One input: Rate per 100m (₹)
  └─ Example: ₹2 per 100m = ₹20/km

slabs mode:
  ├─ Table with rows: Max Km | Cost ₹
  ├─ Add/remove slab rows
  └─ Example: 1km = ₹20, 3km = ₹35, 5km = ₹50
```

## Inline-Editable Slabs
```
renderDeliverySlabs():
  For each slab in array:
  ├─ Row: <input maxKm> | <input cost> | Delete button
  └─ Each input bound to globalDeliverySlabs[index] via onchange
```

## Edge Cases
- **No delivery config** → Defaults: mode="slabs", single slab at 1km/₹20
- **Empty slabs array** → Single default slab, user can add more
- **Negative values** → HTML5 `min="0"` prevents negative inputs
- **Mode switch with data loss** → Switching modes preserves the other mode's data (no data loss)
