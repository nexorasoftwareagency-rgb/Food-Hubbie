# Shared — Code Logics

## Overview

The `shared/` module contains cross-platform utilities used by Admin Dashboard, Bot, Rider App, and Marketplace. These are vanilla JavaScript files (no framework) that run in both Node.js and browser environments via dual CommonJS/window exports.

---

## Files

### `firebase-helpers.js` (257 lines)

**Purpose:** Multi-tenant Firebase path resolution and CRUD operations for SaaS isolation.

**Exports:**

| Export | Type | Description |
|---|---|---|
| `resolvePath(path, businessId, outletId)` | Function | Resolves relative paths to full Firebase paths with tenant scoping |
| `GLOBAL_NODES` | Array | List of root-level nodes NOT scoped to any business/outlet |
| `createFirebaseOps(db)` | Factory | Creates tenant-scoped CRUD helpers bound to a Firebase db instance |
| `invalidateCache(prefix)` | Function | Clears cached entries matching a key prefix |
| `clearCache()` | Function | Clears entire cache |

**Internal State:**

| Variable | Type | Description |
|---|---|---|
| `_cache` | `Map<string, {data, expiry}>` | In-memory cache with TTL for Firebase data |
| `DEFAULT_TTL` | Number (30000) | Default cache TTL — 30 seconds |
| `SETTINGS_TTL` | Number (300000) | Extended TTL for slow-changing data — 5 minutes |

**Functions Detail:**

| Function | Params | Returns | Description |
|---|---|---|---|
| `getTTL(path)` | path: string | Number | Determines cache TTL based on path content (settings/categories/dishes → 5min, others → 30s) |
| `invalidateCache(prefix)` | prefix: string | void | Deletes all cache entries whose key starts with prefix |
| `clearCache()` | — | void | Clears entire `_cache` Map |
| `resolvePath(path, businessId, outletId)` | path, businessId, outletId | string | Resolves path: `botCommands/*` → `bot/{biz}/{outlet}/*`, global nodes → root, everything else → `businesses/{biz}/outlets/{outlet}/{path}` |
| `createFirebaseOps(db)` | db: Firebase DB instance | CRUD object | Factory returning bound CRUD methods |
| `getData(path, businessId, outletId)` | — | any \| null | Cached GET with TTL check |
| `setData(path, data, businessId, outletId)` | data: any | boolean | SET operation with cache invalidation |
| `updateData(path, data, businessId, outletId)` | data: object | boolean | UPDATE with cache invalidation |
| `pushData(path, data, businessId, outletId)` | data: any | string \| null | PUSH with cache invalidation, returns push key |
| `deleteData(path, businessId, outletId)` | — | boolean | DELETE with cache invalidation |
| `getUserProfile(jid, businessId, outletId)` | jid: string | object \| null | Gets WhatsApp user profile by JID under `botUsers/{cleanJid}` |
| `saveUserProfile(jid, data, businessId, outletId)` | jid, data | boolean | Updates WhatsApp user profile |
| `onValue(path, callback, businessId, outletId)` | callback: function | unsubscribe fn | Real-time listener, returns clean-up function |

---

### `utils.js` (267 lines)

**Purpose:** Shared utility functions consolidated from legacy Pizza-bot, Admin, and Rider modules.

**Exports (as `SharedUtils` object):**

| Function | Params | Returns | Description |
|---|---|---|---|
| `calculateDistance(lat1, lon1, lat2, lon2)` | lat/lon numbers | Number (km, 1dp) | Haversine formula distance calculation |
| `calculateDeliveryFee(distanceKm, feeStructure)` | distance, fee slabs array | Number | Tiered delivery fee from distance slabs |
| `formatJid(phone)` | phone: string | string | Sanitizes phone to WhatsApp JID format: `91xxxxxxxxxx@s.whatsapp.net` |
| `cleanPhone(jidOrPhone)` | jidOrPhone: string | string | Extracts clean 10-digit phone from JID or raw input |
| `isShopOpen(openTime, closeTime)` | HH:MM strings | boolean | Checks IST timezone against shop hours (handles overnight) |
| `generateOTP(length)` | length: number (default 4) | string | Random numeric OTP string |
| `getISTDateString(date)` | date?: Date | string | Returns `YYYY-MM-DD` string in IST timezone |
| `getISTTimeString(date)` | date?: Date | string | Returns `HH:MM` string in IST timezone |
| `timeAgo(timestamp)` | timestamp: string/Date | string | Human-readable relative time (e.g., "2 min ago") |
| `formatCurrency(amount)` | amount: number | string | Formats as `₹349` using Indian locale |
| `generateId(prefix)` | prefix?: string | string | Random 8-char alphanumeric ID with optional prefix |

**Internal Helpers:**

| Function | Description |
|---|---|
| `_toRad(deg)` | Converts degrees to radians for Haversine |

**Constants/Helpers used within:**
- Earth radius = 6371 km
- IST timezone: `'Asia/Kolkata'`
- Indian locale for currency: `'en-IN'`

---

### `push-notifications.js` (83 lines)

**Purpose:** Firebase Cloud Messaging (FCM) push notification dispatcher.

**Exports:**

| Export | Type | Description |
|---|---|---|
| `sendPushNotification(admin, token, payload)` | Async Function | Sends high-priority FCM message to a single token |
| `notifyAdmins(admin, db, businessId, outletId, payload)` | Async Function | Broadcasts to all admins in an outlet that have FCM tokens |

**Functions Detail:**

| Function | Params | Returns | Description |
|---|---|---|---|
| `sendPushNotification` | admin, token, payload ({title, body, data}) | `{success, messageId\|error}` | Sends FCM with Android high priority + APNS sound/badge |
| `notifyAdmins` | admin, db, businessId, outletId, payload | Promise.all | Reads `admins` root node, filters by outletId + fcmToken, sends to all |

**FCM Message Structure:**
```javascript
{
  notification: { title, body },
  data: payload.data || {},
  token: recipient_token,
  android: { priority: 'high', notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK', channelId: 'high_importance_channel' } },
  apns: { payload: { aps: { sound: 'default', badge: 1 } } }
}
```
