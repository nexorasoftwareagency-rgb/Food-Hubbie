# Bot Firebase (firebase.js) — Firebase Rules

## Notes
- Bot uses **Firebase Admin SDK** with service account — **bypasses all security rules**
- All Firebase Realtime Database rules are defined in `database.rules.json`
- The Admin SDK credential has full read/write access regardless of rules
- Customers and riders must use the client SDK (Firebase Auth) with rules restricting access

## Relevant Rules in `database.rules.json`
The security rules primarily protect against unauthorized client access:
| Path | Rule |
|---|---|
| `businesses/{b}/outlets/{o}/orders` | Admin read/write |
| `businesses/{b}/outlets/{o}/dishes` | Admin read/write |
| `businesses/{b}/outlets/{o}/categories` | Admin read/write |
| `riders/{riderId}/notifications` | Admin write, rider read |
| `system/admins/{uid}` | Owner read |

## Bot-Specific Paths
| Path | Access Level |
|---|---|
| `system/botSessions/{bid}/{oid}` | Bot only (Admin SDK) |
| `businesses/{bid}/outlets/{oid}/botCommands` | Admin write, bot read/delete |
| `businesses/{bid}/outlets/{oid}/botStatus` | Bot write (heartbeat) |
| `logs/botAudit` | Bot write (Admin SDK) |
