# Bot Entry (index.js) — Firebase Rules

## Paths Written
| Path | Permissions | Purpose |
|---|---|---|
| `businesses/{bid}/outlets/{oid}/botStatus` | admin write | Heartbeat liveness |

## Notes
- No read operations in this module
- Heartbeat write is idempotent — only the current bot instance writes
- Rules should allow admin write to `botStatus` (no customer/rider access needed)
