# OutletDetails Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `slugs/outlets/{slug}` | Resolve slug → businessId + outletId |
| `businesses/{bizId}/outlets/{outletId}` | Outlet metadata |
| `businesses/{bizId}/outlets/{outletId}/dishes` | Menu items |
| `businesses/{bizId}/outlets/{outletId}/categories` | (for category labels) |
| `businesses/{bizId}/outlets/{outletId}/settings/Store` | Store hours, coords |

## Paths Written
- None (add-to-cart writes to CartContext, not directly to Firebase at this stage)

## Notes
- All reads are public
- Menu items include stock/availability data for sold-out indicators
