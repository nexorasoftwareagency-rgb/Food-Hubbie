# Bot Firebase (firebase.js) — Database Structure

## Path Resolution Pattern
All tenant-scoped operations resolve to:
```
businesses/{BUSINESS_ID}/outlets/{OUTLET_ID}/{path}
```

## Global Data
Accessed directly via `db.ref(path)`:
```
system/botSessions/{bid}/{oid}/{safeJid}
system/settings/delivery/slabs
logs/botAudit
```

## Business/Outlet Data (via wrappers)
| Call | Resolves To |
|---|---|
| `getData('orders')` | `businesses/{bid}/outlets/{oid}/orders` |
| `getData('dishes', 'outlet2')` | `businesses/{bid}/outlets/outlet2/dishes` |
| `resolvePath('settings/Store')` | `businesses/{bid}/outlets/{oid}/settings/Store` |

## Service Account
- **File**: `bot/service-account.json`
- **Required on**: EC2 production
- **Optional on**: Local dev (falls back to application default credentials)
- **Not committed to**: GitHub (in `.gitignore`)

## Config
- **File**: `config/firebase-config.js`
- Contains: `FIREBASE_DATABASE_URL`
- Overridable via: `FIREBASE_DATABASE_URL` environment variable
