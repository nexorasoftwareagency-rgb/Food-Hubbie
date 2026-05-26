# Available View — Database Structure

## Order (available)
`businesses/{b}/outlets/{o}/orders/{id}`
Required fields for available view:
| Field | Value Criteria |
|---|---|
| `status` | `"Placed"` |
| `assignedRider` | `null` or not set |
| `customerName` | Displayed on card |
| `deliveryAddress` | Displayed on card |
| `items` | Summary on card |
| `totalAmount` | Displayed |
| `deliveryFee` | Displayed |
| `outletLat` / `outletLng` | Used for distance calc |

## Outlet
`businesses/{b}/outlets/{o}/settings/Delivery`
- `acceptRadius` — Max distance for accepting (default: 1km)
- `pickupRadius` — Max distance for pickup (default: 300m)
- `dropRadius` — Max distance for drop (configurable)
