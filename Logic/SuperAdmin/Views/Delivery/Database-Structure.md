# Delivery Tab — Database Structure

## Delivery Config
`system/settings/delivery`
| Field | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `"slabs"` | `per_100m` or `slabs` |
| `per100mRate` | number | `2` | Rate per 100m in ₹ |
| `slabs` | array | `[]` | Array of slab objects |

## Slab Object
| Field | Type | Description |
|---|---|---|
| `maxKm` | number | Max distance for this slab |
| `cost` | number | Delivery cost in ₹ |

## Example
```json
{
  "mode": "slabs",
  "per100mRate": 2,
  "slabs": [
    { "maxKm": 1, "cost": 20 },
    { "maxKm": 3, "cost": 35 },
    { "maxKm": 5, "cost": 50 },
    { "maxKm": 10, "cost": 80 }
  ]
}
```
