# Bot Firebase (firebase.js) — Code Logics

## Overview
Unified Firebase connector for the bot. Initializes Firebase Admin SDK with service account, wraps shared helpers with tenant-scoped convenience functions.

## Dependencies
- `firebase-admin` — Admin SDK
- `../shared/firebase-helpers` — `createFirebaseOps`, `resolvePath`
- `../config/firebase-config` — `FIREBASE_DATABASE_URL`

## Configuration
| Variable | Source | Default |
|---|---|---|
| `FIREBASE_DATABASE_URL` | `config/firebase-config.js` (overridable by env var) | Firebase project URL |
| `BUSINESS_ID` | `process.env.BUSINESS_ID` | `"business_roshani"` |
| `OUTLET_ID` | `process.env.OUTLET_ID` | `"outlet_default"` |

## Initialization
1. Load `service-account.json` from `bot/` directory
2. If exists → initialize with `admin.credential.cert(serviceAccount)`
3. If not found → initialize with no credentials (warns about EC2 permission issues)
4. Catch errors → fallback to credential-less init
5. Guard: `admin.apps.length` check prevents double initialization

## Database Reference
```js
const db = admin.database();
const ops = createFirebaseOps(db);
```

## Convenience Wrappers
All wrappers support `outletOverride` for dynamic outlet switching (used in Global Discovery mode):

| Function | Delegates To | Description |
|---|---|---|
| `getData(path, outletOverride?)` | `ops.getData(path, BUSINESS_ID, outletOverride\|OUTLET_ID)` | Read data |
| `setData(path, data, outletOverride?)` | `ops.setData(...)` | Write data |
| `updateData(path, data, outletOverride?)` | `ops.updateData(...)` | Partial update |
| `pushData(path, data, outletOverride?)` | `ops.pushData(...)` | Push with auto-ID |
| `deleteData(path, outletOverride?)` | `ops.deleteData(...)` | Delete path |
| `getUserProfile(jid, outletOverride?)` | `ops.getUserProfile(...)` | Phone-based profile lookup |
| `saveUserProfile(jid, data, outletOverride?)` | `ops.saveUserProfile(...)` | Save customer profile |
| `getGlobalData(path)` | Direct `db.ref(path)` | Read outside tenant scope |

## Exports
```js
{
  db, admin,
  resolvePath: (p) => resolvePath(p, BUSINESS_ID, OUTLET_ID),
  getData, setData, updateData, deleteData, pushData,
  getUserProfile, saveUserProfile,
  getGlobalData,
  BUSINESS_ID, OUTLET_ID
}
```
