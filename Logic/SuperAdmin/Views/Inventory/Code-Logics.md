# Inventory Tab — Code Logics

## Purpose
Ecosystem-wide inventory control — monitor stock across all outlets, adjust quantities, toggle availability.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadInventory()` | Tab load / Refresh | Scan all businesses/outlets/dishes for inventory |
| `renderInventoryTable(items)` | Data ready | Build inventory table |
| `quickAdjustStock(dishId, delta, outletPath)` | +/- button | Increment/decrement stock |
| `toggleAvailability(dishId, outletPath, current)` | Toggle | Force available/unavailable |
| `filterInventory()` | Search input | Filter by dish name or outlet |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}` | Read, Write | Dish stock & availability |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}/stock` | Write | Stock adjustment |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}/isAvailable` | Write | Toggle availability |

## Inventory Table Columns
| Column | Source |
|---|---|
| Dish Details | `dish.name`, `dish.price` |
| Partner Outlet | Business + Outlet name |
| Stock Level | `dish.stock` (colored: green > 20, yellow 10-20, red < 10) |
| Status | `dish.isAvailable` → Available / Unavailable badge |
| Last Updated | `dish.lastStockUpdate` |
| Actions | + / - buttons, Toggle button |

## KPI Cards (3)
| ID | Computation |
|---|---|
| `#lowStockCount` | Dishes with stock < 10 |
| `#totalActiveItems` | Dishes where `isAvailable === true` |
| `#outOfStockCount` | Dishes where `stock === 0` |

## Stock Adjustment
```
quickAdjustStock(dishId, delta, outletPath):
  Read current stock → calculate newStock = Math.max(0, current + delta)
  Update: dishes/{dishId}/stock = newStock
  Update: dishes/{dishId}/lastStockUpdate = Date.now()
  If newStock === 0 → auto-set isAvailable = false
```

## Edge Cases
- **No dishes** → "No inventory items found" empty state
- **Large inventory** → Table could be very long; search filter helps
- **Negative stock prevented** → `Math.max(0, current + delta)` ensures non-negative
- **Auto-unavailable at 0** — stock depletion automatically marks dish as unavailable
- **Emergency Freeze** (planned) — bulk set all dishes to unavailable
