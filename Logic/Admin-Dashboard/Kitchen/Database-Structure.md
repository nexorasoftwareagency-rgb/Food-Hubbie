# KitchenPage Database Structure

## Orders Node (Read Fields)
```
businesses/{b}/outlets/{o}/orders/{orderId}/
```

| Field | Type | Usage |
|-------|------|-------|
| `orderId` | string | Card display |
| `customerName` | string | Card display |
| `phone` | string | Card display |
| `cart[]` | array | Item extraction via `getItems()` |
| `items{}` | object | Alternative item format |
| `subtotal` | number | Not displayed |
| `discount` | number | Not displayed |
| `tax` | number | Not displayed |
| `total` | number | Card display |
| `status` | string | **Primary field** — filter, color, flow |
| `type` | string | Card item type display |
| `address` | string | Card display |
| `notes` | string | Special instructions display |
| `specialInstructions` | string | Alternative notes field |
| `createdAt` | timestamp | Not used (timer uses client-side counter) |
| `updatedAt` | timestamp | Not used |

## Written Fields
- `status` — updated to next flow status or `"Cancelled"`
