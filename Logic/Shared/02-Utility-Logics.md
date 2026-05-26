# Shared — Utility Logics

## Core Concepts

### 1. Multi-Tenant Path Resolution (`resolvePath`)

The architecture uses a **business → outlet → data** hierarchy for full SaaS isolation.

```
/businesses/{businessId}/outlets/{outletId}/orders/{orderId}
/businesses/{businessId}/outlets/{outletId}/dishes/{dishId}
/businesses/{businessId}/outlets/{outletId}/categories/{catId}
```

**Global nodes** (NOT scoped to any business/outlet):

```
/admins/{uid}
/riders/{riderId}
/riderStats/{riderId}
/bot/{businessId}/{outletId}/*
/logs/*
/superAdmin/*
/businesses/...  (business list itself)
/platformConfig/*
```

**Special alias — `botCommands`:**
- `botCommands/*` → `bot/{businessId}/{outletId}/*`
- Kept for backward compatibility with older bots/tools

**Resolution logic:**
```
resolvePath("orders/abc123", "biz_001", "outlet_pizza")
  → "businesses/biz_001/outlets/outlet_pizza/orders/abc123"

resolvePath("admins/uid123")
  → "admins/uid123"  (global, no scoping)

resolvePath("botCommands/config")
  → "bot/{bizId}/{outletId}/config"
```

### 2. Cache Layer

- In-memory `Map` cache for Firebase reads
- Default TTL: 30 seconds
- Extended TTL for settings/categories/dishes: 5 minutes
- Cache auto-invalidated on write operations (set/update/push/delete)
- Manual invalidation available via `invalidateCache(prefix)` and `clearCache()`

### 3. Phone/JID Handling (`utils.js`)

Used by Bot for WhatsApp communication:

```
Raw phone input → formatJid() → 91xxxxxxxxxx@s.whatsapp.net
JID or phone → cleanPhone() → 10-digit display number
```

**Phone normalization rules (formatJid):**
1. Strip all non-numeric characters
2. Remove leading `0`
3. If 10 digits → prepend `91` (India country code)
4. Remove leading `+` if present
5. Append `@s.whatsapp.net`

### 4. Distance & Delivery Fee

Used by Bot for delivery cost calculation:

```
calculateDistance(lat1, lon1, lat2, lon2)
  → Haversine formula → km (1 decimal)

calculateDeliveryFee(distanceKm, feeStructure)
  → Tiered slab lookup:
    [
      { upToKm: 3, fee: 30 },
      { upToKm: 5, fee: 50 },
      { upToKm: 10, fee: 80 }
    ]
  → Beyond max slab → returns highest slab fee
```

### 5. Shop Hours Check

Used by Bot/Customer to determine if ordering is available:

```
isShopOpen("11:00", "23:00")
  → Compares current IST time against open/close window
  → Handles overnight scenarios (close < open = next day)
  → Returns true if openTime/closeTime are not configured
```

### 6. OTP Generation

Used in "Out for Delivery" flow for delivery verification:

```
generateOTP(4) → "4829" (random 4-digit string)
generateOTP(6) → "193847" (6-digit for higher security)
```

### 7. IST Date/Time

Used throughout for Indian timezone consistency:

```
getISTDateString() → "2026-05-25"
getISTTimeString() → "17:30"
timeAgo("2026-05-25T12:00:00Z") → "2 hr ago"
```

### 8. Push Notifications (FCM)

Used by Bot to send mobile alerts to admins:

```
sendPushNotification(adminInstance, fcmToken, { title, body, data })
  → Sends high-priority Android + APNS notification
  → Returns { success: true, messageId } or { success: false, error }

notifyAdmins(adminInstance, db, businessId, outletId, payload)
  → Reads all admins from /admins root node
  → Filters by outletId match AND fcmToken existence
  → Sends parallel notifications to all matching admins
```
