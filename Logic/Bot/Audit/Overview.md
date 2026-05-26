# Bot Audit (audit.js) — Overview

## Purpose
Logs bot interactions and automated actions to a Firebase audit trail for monitoring and debugging.

## Function: `logBotAudit(action, details = {}, jid = 'system')`

### Parameters
| Param | Type | Default | Description |
|---|---|---|---|
| `action` | string | required | Action identifier (e.g., `"BOT_RESET"`, `"BOT_ORDER_PLACED"`) |
| `details` | object | `{}` | Arbitrary data attached to the action |
| `jid` | string | `"system"` | WhatsApp JID of the user who triggered the action |

### Audit Entry Schema
| Field | Type | Example |
|---|---|---|
| `timestamp` | number (epoch ms) | `1748191200000` |
| `action` | string | `"BOT_ORDER_PLACED"` |
| `details` | object | `{ orderId: "FH-...", total: 450 }` |
| `whatsappJid` | string | `"919876543210@s.whatsapp.net"` |
| `businessId` | string | `"business_roshani"` |
| `outletId` | string | `"outlet_pizza"` |
| `userAgent` | string | `"Foodhubbie-Bot-Engine/1.0"` |

### Storage
- **Path**: `logs/botAudit` (global — not tenant-scoped)
- **Method**: `pushData` (Firebase push with auto-generated key)

### Known Actions Logged
| Action | When |
|---|---|
| `BOT_RESET` | User types "reset" or "menu" |
| `BOT_ORDER_PLACED` | Order confirmed via WhatsApp |

## Points
- No read/query support — logs are write-only via this module
- Auto-generated Firebase push keys make chronological ordering easy but querying by action/date requires iteration
- `details` has no schema validation — any data shape accepted
- Called from `whatsapp-engine.js` only currently; status-monitor and commands could also log
- No cleanup/retention — audit log grows indefinitely
