# Shared Utilities — Cross-Cutting Logic

**Source**: `shared/utils.js` (267 lines), `shared/push-notifications.js` (83 lines), `shared/firebase-helpers.js` (257 lines)  
**Workspace**: `@foodhubbie/shared` (npm workspace)  
**Consumed by**: `bot/`, `scripts/`, potentially all apps

---

## 1. Code-Logics

### `shared/utils.js` — Pure Utility Functions

| Function | Input | Output | Notes |
|---|---|---|---|
| `calculateDistance(lat1, lon1, lat2, lon2)` | 2 coordinate pairs | Distance in km (1 decimal) | Haversine formula. Used by bot for delivery fee calc, RiderApp for proximity gates |
| `calculateDeliveryFee(distanceKm, feeStructure)` | distance, slab array `[{upToKm, fee}]` | Fee amount | Normalises slab keys (`upToKm` or `km`), sorts, walks tiers. Falls back to highest slab fee |
| `formatJid(phone)` | Raw phone string | `91xxxxxxxxxx@s.whatsapp.net` | Strips non-digits, adds 91 prefix if 10-digit, removes leading 0/+ |
| `generateOTP()` | none | 4-digit string | `Math.floor(1000 + Math.random() * 9000)` |
| `isShopOpen(hours, shopStatus, istTimestring)` | Opening hours config, status flag, optional IST string | boolean | Timezone-aware (IST UTC+5:30). Checks day-of-week + time window |
| `timeAgo(timestamp)` | Unix ms | Relative string ("2 min ago", "1 hour ago") | Truncated to largest unit. No seconds granularity |
| `currency(amount)` | number | `"₹499"` | Indian rupee formatting |
| `extractPhone(jid)` | WhatsApp JID | 10-digit phone | Strips `@s.whatsapp.net`, removes 91 prefix |

### `shared/push-notifications.js` — FCM Dispatcher

| Function | Input | Behavior |
|---|---|---|
| `sendPushNotification(admin, token, payload)` | firebase-admin instance, FCM token, `{ title, body, data }` | Sends high-priority Android + APNS notification. Logs success/failure |
| `notifyAdmins(admin, db, businessId, outletId, payload)` | admin, db ref, businessId, outletId, payload | Reads `admins/` node, filters by outletId + fcmToken, sends to all matching admins |

### `shared/firebase-helpers.js` — Firebase Multi-Tenant Helpers

| Function | Input | Output | Notes |
|---|---|---|---|
| `resolvePath(path, businessId, outletId)` | relative path, biz ID, outlet ID | Full Firebase path | GLOBAL_NODES (admins,riders,riderStats,bot,logs,superAdmin,businesses,platformConfig) stay at root; everything else scoped to `businesses/{bid}/outlets/{oid}/{path}` |
| `createFirebaseOps(db)` | Firebase RTDB instance | Object with CRUD methods | Returns bound `getData,setData,updateData,deleteData,pushData` that auto-call resolvePath + cache |
| `getUserProfile(jid, bid, oid)` | WhatsApp JID, IDs | Profile object or null | Reads from `businesses/{bid}/outlets/{oid}/botUsers/{cleanJid}` |
| `saveUserProfile(jid, data, bid, oid)` | JID, profile data, IDs | Write result | Saves to same path |
| `invalidateCache(prefix)` | Cache key prefix | void | Clears all cache entries starting with prefix |

### Cache Layer
```javascript
const _cache = new Map();
const DEFAULT_TTL = 30000;      // 30s for order data
const SETTINGS_TTL = 300000;    // 5min for settings/categories/dishes
```

---

## 2. Firebase-Rules

These utilities are consumed server-side (bot) via Firebase Admin SDK, which bypasses RTDB rules. No direct client-side access.

---

## 3. Database-Structure

**GLOBAL_NODES** (accessed without business/outlet scoping):
```
admins/{uid}
riders/{uid}
riderStats/{riderId}
bot/{bid}/{oid}/commands
logs/{botAudit, marketplaceAudit, audit, lostSales, riderErrors}
superAdmin/
businesses/{bid}
platformConfig/
```

**Tenant-scoped paths** (prefixed with `businesses/{bid}/outlets/{oid}/`):
```
orders/{pushId}
dishes/{dishId}
categories/{catId}
settings/{Store, Delivery, Bot, Display}
inventory/{itemId}
reviews/{pushId}
feedbacks/{pushId}
settlements/{pushId}
wallet/{txId}
meta/
botCommands/{pushId}  ← note: this is an alias for bot/{bid}/{oid}/commands
botStatus
botUsers/{jid}
```

---

## 4. Connecting-Nodes

```
[Bot needs to send WhatsApp message to customer]
  -> formatJid(customerPhone)
  -> sock.sendMessage(jid, { text })
  -> logBotAudit('MSG_SENT', { phone, jid }, tenant)

[Bot calculates delivery fee for customer location]
  -> calculateDistance(storeLat, storeLng, customerLat, customerLng)
  -> calculateDeliveryFee(distance, feeStructure)
  -> returns fee in rupees

[Admin dashboard creates audit log entry]
  -> logAudit(businessId, outletId, action, details, actor)
  -> Write to businesses/{bid}/outlets/{oid}/logs/audit/{pushId}
```

---

## 5. Complete Flow: Cache-Aware Data Read

1. Bot calls `t.getData('orders')`
2. `createFirebaseOps().getData()` calls `resolvePath('orders', bid, oid)` → `businesses/{bid}/outlets/{oid}/orders`
3. Cache lookup: keys prefixed with resolved path
4. Cache hit (TTL 30s) → return cached value
5. Cache miss → `db.ref(fullPath).once('value')` → store in cache → return
6. On write: `invalidateCache(prefix)` clears affected entries
