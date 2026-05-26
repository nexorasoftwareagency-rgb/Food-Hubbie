# Inventory — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/menu | Read | Menu items |

## Data Shape
```json
{
  "businesses": {
    "{bid}": {
      "outlets": {
        "{oid}": {
          "menu": {
            "{dishId}": {
              "name": "Butter Chicken",
              "price": 350,
              "category": "Main Course",
              "stock": 50,
              "available": true,
              "image": "https://firebasestorage...",
              "description": "Creamy butter chicken with naan"
            }
          }
        }
      }
    }
  }
}
```

## Menu Fields
| Field | Type | Description |
|-------|------|-------------|
| name | String | Dish display name |
| price | Number | Price in ₹ |
| category | String | Category grouping (Main Course, Starter, etc.) |
| stock | Number | Current stock count |
| available | Boolean | Whether dish is available for ordering |
| image | String | Firebase Storage URL |
| description | String | Dish description |

## Key Notes
- stock is adjusted via transaction (atomic increment/decrement)
- available is toggled via direct boolean write
- Price, name, category are never modified from Inventory tab
- No sub-collection per category — category is just a string field
