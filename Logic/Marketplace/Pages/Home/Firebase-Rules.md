# Home Page — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bizId}/outlets/{outletId}` | Outlet metadata (all outlets for public listing) |
| `system/platformConfig/cuisines` | Cuisine list |
| `businesses/{bizId}/outlets/{outletId}/dishes` | Menu items for global menu |
| `businesses/{bizId}/outlets/{outletId}/reviews` | Reviews |

## Notes
- All reads are **public** — no authentication required
- Unauthenticated users can browse all outlets and menu items
- No writes from Home page
