# WhatsApp Engine (whatsapp-engine.js) — Firebase Rules

## Paths Read
| Path | Purpose |
|---|---|
| `businesses/{bid}/outlets/{oid}/settings/Store` | Shop hours, store name, coords, banner image |
| `businesses/{bid}/outlets/{oid}/settings/Bot` | Menu image, bot config |
| `businesses/{bid}/outlets/{oid}/settings/Delivery` | Delivery fee slabs |
| `businesses/{bid}/outlets/{oid}/categories` | Menu categories |
| `businesses/{bid}/outlets/{oid}/dishes` | Menu dishes |
| `businesses/{bid}/outlets/{oid}/inventory` | Stock levels |
| `system/botSessions/{bid}/{oid}/{safeJid}` | Persistent session |
| `businesses` (global) | Outlet discovery (Global mode) |
| `system/settings/delivery/slabs` | Global delivery fee defaults |

## Paths Written
| Path | Purpose |
|---|---|
| `businesses/{bid}/outlets/{oid}/orders/{orderId}` | New order |
| `system/botSessions/{bid}/{oid}/{safeJid}` | Session persistence |
| `businesses/{bid}/outlets/{oid}/customers/{phone}` | User profile (via saveUserProfile) |
| `logs/botAudit` | Audit trail (via logBotAudit) |

## Notes
- Bot uses Admin SDK — bypasses rules
- Customers/riders should NOT have direct access to these paths
