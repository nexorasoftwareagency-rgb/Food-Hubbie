# Database & Security Rules — Firebase Security Model

**Source**: `database.rules.json` (348 lines), `storage.rules` (59 lines)  
**App Check**: Client-side initialized (reCAPTCHA v3), console-enforced for RTDB

---

## 1. Code-Logics

### Firebase Database Rules — Access Pattern Summary

#### Root-level reads
| Path | Read rule | Write rule |
|---|---|---|
| `admins` | superadmin only | superadmin only |
| `admins/{uid}` | self or superadmin | superadmin only |
| `onboarding_requests` | admin or superadmin | any auth (first), admin or superadmin (update) |
| `riders` | admin or superadmin | — |
| `riders/{uid}` | self or admin | self or admin |
| `riders/{uid}/kycStatus` | — | superadmin only |
| `riders/{uid}/verified` | — | superadmin only |
| `businesses` | **true (public)** | superadmin only |
| `businesses/{bid}` | **true (public)** | superadmin or assigned admin |
| `businesses/{bid}/outlets/{oid}/orders` | **true (public)** | any auth for new + admin or rider (`riderId == auth.uid`) for update |
| `businesses/{bid}/outlets/{oid}/dishes` | **true (public)** | admin auth |
| `businesses/{bid}/outlets/{oid}/categories` | **true (public)** | admin auth |
| `businesses/{bid}/outlets/{oid}/settings` | **true (public)** | admin auth |
| `businesses/{bid}/outlets/{oid}/inventory` | **true (public)** | admin auth |
| `businesses/{bid}/outlets/{oid}/reviews` | **true (public)** | any auth |
| `businesses/{bid}/outlets/{oid}/settlements` | admin auth | admin auth |
| `businesses/{bid}/outlets/{oid}/wallet` | admin auth | admin auth |
| `businesses/{bid}/outlets/{oid}/meta` | **true (public)** | admin auth |
| `businesses/{bid}/outlets/{oid}/broadcasts` | **true (public)** | admin auth |
| `system` | superadmin | superadmin |
| `users/{uid}` | self or superadmin | self or superadmin |
| `superAdmin` | superadmin only | superadmin only |
| `slugs` | **true (public)** | superadmin |
| `orders` (global index) | **true (public)** | any auth for new + admin for update |
| `logs/marketplaceAudit` | auth | **auth (CRIT-3 fixed)** |
| `logs/botAudit` | auth | auth |
| `logs/audit` | auth | admin auth |
| `logs/lostSales` | auth | any auth |
| `logs/riderErrors` | auth | any auth |
| `Pizza-Shop` | **true (public)** | **false (legacy locked)** |
| `Cake-Shop` | **true (public)** | **false (legacy locked)** |
| `errorLogs` | auth | any auth |

### Storage Rules
| Path | Read | Write | Constraints |
|---|---|---|---|
| `admins/{uid}/{allPaths}` | admin | admin | — |
| `riders/{uid}/{allPaths}` | self or admin | admin | — |
| `bot/{bid}/{oid}/images/{allPaths}` | admin | any auth | `request.resource.size < 5MB`, content-type image/* |
| `{outlet}/dishes/{dishId}/{allPaths}` | auth + same outlet OR admin | admin | Image only (<5MB) |
| `{outlet}/categories/{catId}/{allPaths}` | auth + same outlet OR admin | admin | Image only (<5MB) |
| `receipts/{allPaths}` | admin | admin | — |
| `users/{uid}/{allPaths}` | self or admin | admin | — |

### App Check
- **Client-side**: Initialized in `admin-dashboard/src/firebase.js` using `initializeAppCheck` with `ReCaptchaV3Provider`
- **Debug token**: `window.__FOODHUBBIE_APP_CHECK_DEBUG_TOKEN__` for dev hosts
- **Enforcement**: Must be enabled manually in Firebase Console → App Check → RTDB

---

## 2. Security Invariants

### Tenant Isolation (3-layer)
1. **Type layer**: `PlaceOrderInput.businessId` is required (no fallback)
2. **Service layer**: `submitOrder()` throws if businessId or outletId is empty
3. **Bot layer**: `tenantContext()` hard-fails at boot if bid/oid unset

### RBAC Matrix

| Role | Can read | Can write | Managed at |
|---|---|---|---|
| Supreme Admin | Everything | Everything (system/, superAdmin/, all biz) | Firebase custom claim `superadmin: true` |
| Super Admin | Everything except `superAdmin/` | Everything except `system/` and `superAdmin/` | `admins/{uid}.isSuper === true` |
| Admin | Own business + outlet | Own business + outlet | `admins/{uid}.businessId + outletId` |
| Rider | Self + assigned orders | Self + assigned orders | `riders/{uid}` node |
| Customer | Public data + self orders | Self orders only | Firebase Auth UID |

---

## 3. Database Path Aliases

| Alias | Resolved path |
|---|---|
| GLOBAL_NODES | `{path}` (no prefix) |
| Tenant-scoped | `businesses/{bid}/outlets/{oid}/{path}` |
| `botCommands` | `bot/{bid}/{oid}/commands` |

---

## 4. Connecting-Nodes

```
[Customer submits order]
  -> Request hits RTDB at businesses/{bid}/outlets/{oid}/orders/{pushId}
  -> Rules check: !data.exists() && newData.exists() (create-only)
  -> No auth required for create (public write for new orders)
  -> Rider update: must have newData.riderId == auth.uid

[Admin updates order status]
  -> Request must satisfy:
       root.child('admins').child(auth.uid).child('outletId').val() == $oid
    OR: auth.token.superadmin === true

[Legacy path access]
  -> Pizza-Shop/.write = false (completely locked)
  -> Read still allowed for existing users/menus that reference legacy paths
```

---

## 5. Complete Flow: Order Write Security

1. Customer places order → `push()` to `businesses/{bid}/outlets/{oid}/orders/`
2. Rules: `.write: "(!data.exists() && newData.exists())"` → create allowed for public
3. Customer receives `pushId` as order reference
4. Admin updates status → `.write` checks: admin with matching `outletId` or superadmin
5. Rider accepts order → `.write` checks: `newData.child('riderId').val() == auth.uid`
6. Rider updates delivery timestamps → same `riderId` check
7. Order marked "Delivered" → no further writes accepted (data exists, riderId no longer matches new data conditions)
