# Bot Firebase (firebase.js) — Points

## Edge Cases
- **`service-account.json` missing on EC2** — bot starts with `admin.initializeApp({databaseURL})` only; Firebase calls fail with permission denied
- **Env vars not set** — falls back to hardcoded defaults (`business_roshani`, `outlet_default`)
- **Double initialization** — `admin.apps.length` guard prevents error on hot reload
- **`outletOverride` as null** — correctly uses default `OUTLET_ID`; no crash

## Gotchas
- `getGlobalData('businesses')` fetches ALL businesses/outlets — large payload on first call
- Service account is NOT in `.gitignore` per user — committed to repo (security risk)
- No connection lifecycle management — if Firebase goes down, operations throw (caught upstream)
- `resolvePath` returns string only — does NOT validate the path exists

## Future Improvements
- Move service account to environment variable (base64) or secret manager
- Add Firebase connection retry logic
- Add connection health check endpoint
- Scope service account to specific paths for least privilege
