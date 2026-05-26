# Bot Commands (commands.js) — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bid}/outlets/{oid}/botCommands` | Listen for admin commands |
| `businesses/{bid}/outlets/{oid}/orders` | Daily report aggregation |
| `businesses/{bid}/outlets/{oid}/settings/Store` | Get `reportPhone` |

## Paths Written
| Path | Purpose |
|---|---|
| `businesses/{bid}/outlets/{oid}/botCommands/{cmdId}` | **Deleted** after processing |

## Notes
- Bot uses Admin SDK — bypasses rules
- `botCommands` path should be writable by admin dashboard (authenticated admin users)
