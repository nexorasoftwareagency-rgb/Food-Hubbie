# Inventory Tab — Database Structure

## Dish (Inventory Item)
`businesses/{bid}/outlets/{oid}/dishes/{dishId}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Dish name |
| `price` | number | Selling price |
| `category` | string | Category (starter/main/beverage) |
| `stock` | number | Current stock quantity |
| `isAvailable` | boolean | Available for ordering |
| `lastStockUpdate` | number | Last stock change timestamp |
| `image` | string | Dish image URL |
| `description` | string | Dish description |

## Computed KPIs (client-side)
| KPI | Formula |
|---|---|
| Low Stock Items | `count(dish.stock < 10)` |
| Total Active Items | `count(dish.isAvailable === true)` |
| Out of Stock Items | `count(dish.stock === 0 || dish.isAvailable === false)` |

## Stock Level Coloring
| Level | Threshold | Color |
|---|---|---|
| Healthy | `stock >= 20` | Green |
| Medium | `stock >= 10 && stock < 20` | Yellow |
| Low | `stock > 0 && stock < 10` | Orange |
| Out | `stock === 0` | Red |
