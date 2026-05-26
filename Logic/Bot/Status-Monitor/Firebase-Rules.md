# Bot Status Monitor (status-monitor.js) — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bid}/outlets/{oid}/orders` | Listen for order changes |
| `businesses/{bid}/outlets/{oid}/settings/Store` | Get admin reportPhone + store name |
| `businesses/{bid}/outlets/{oid}/settings/Bot` | Get notification images |
| `riders` | Find online riders for broadcast |

## Paths Written
| Path | Purpose |
|---|---|
| `riders/{riderId}/notifications/{notifId}` | In-app rider notification |

## Notes
- `orders/` must be readable by bot (admin service account)
- `riders/{riderId}/notifications/` — bot writes as admin; rider reads their own
- Bot uses Firebase Admin SDK — bypasses all security rules
