# Bot Entry (index.js) — Code Logics

## Overview
Orchestrates WhatsApp connection lifecycle, initializes listeners, and manages heartbeat.

## Dependencies
- `@whiskeysockets/baileys` — WhatsApp Web API (multi-device)
- `qrcode-terminal` — QR display in terminal
- `pino` — Logging (silent level)
- `./firebase` — BUSINESS_ID, OUTLET_ID, updateData
- `./whatsapp-engine` — handleIncomingMessage
- `./status-monitor` — initStatusMonitor
- `./commands` — initCommandListener

## State & Variables
| Variable | Type | Description |
|---|---|---|
| `BUSINESS_ID` | string | From env/firebase.js |
| `OUTLET_ID` | string | From env/firebase.js |
| `sessionPath` | string | `sessions/{bizId}_{outletId}/` |
| `sock` | WASocket | Baileys socket instance |
| `version` | {string,number} | Latest Baileys version |

## Flow

### `startBot()`
1. Create session storage directory under `sessions/{BUSINESS_ID}_{OUTLET_ID}`
2. Load multi-file auth state (`useMultiFileAuthState`)
3. Fetch latest Baileys version
4. Create WASocket with silent logger, browser ID `['Foodhubbie SaaS', 'Chrome', '1.0.0']`
5. Register `creds.update` → saveCreds
6. Register `connection.update` handler:
   - `qr` → print QR via `qrcode-terminal`
   - `connection === 'open'` → initStatusMonitor, initCommandListener, start heartbeat interval
   - `connection === 'close'` → re-authenticate if not logged out
7. Register `messages.upsert` handler:
   - Filter `type !== 'notify'`
   - Filter messages that are empty or `key.fromMe`
   - Call `handleIncomingMessage(sock, msg)` for each

### Heartbeat
- Interval: 60 seconds
- Writes `botStatus` to Firebase:
  ```js
  { lastSeen: Date.now(), status: 'Online', businessId: BUSINESS_ID, outletId: OUTLET_ID }
  ```

### Error Handling
- `uncaughtException` — logged to console
- `unhandledRejection` — logged to console
- Script does NOT exit on uncaught — continues running
