# Foodhubbie — Canonical Firebase Realtime Database Tree

**Project**: `food-hubbie`  
**Database URL**: `https://food-hubbie-default-rtdb.firebaseio.com`  
**Rules**: `database.rules.json` (348 lines)  

---

## Root Node Tree

```
/root
├── admins/{uid}
│   ├── email, password, businessId, outletId/outlet, role, isSuper, phone, tfaSecret, fcmToken
│   └── .indexOn: [businessId, outletId, email, isSuper]
│
├── onboarding_requests/{uid}
│   ├── businessName, ownerName, email, phone, address, gstin, fssai
│   ├── outletName, outletType, cuisine, coordinates
│   ├── status: "pending"|"approved"|"rejected"
│   ├── createdAt, processedBy, processedAt
│   └── .indexOn: [status, createdAt, email]
│
├── riders/{uid}
│   ├── name, fatherName, age, aadharNo (masked), aadharPhoto (URL)
│   ├── qualification, phone, address, profilePhoto
│   ├── status: "Online"|"Offline", lastSeen, fcmToken
│   ├── businessId, isAdmin (OTP override)
│   ├── wallet: { balance, totalEarned, lastTx, lastTxAt }
│   ├── ledger/{txId}: { txId, orderId, amount, type:"EARNING"|"SETTLEMENT"|"ADJUSTMENT",
│   │     description, timestamp, outlet, method }
│   ├── notifications/{notifId}: { title, body, timestamp, read, type, icon }
│   ├── location: { lat, lng, accuracy, ts, lastUpdate, signalLost? }
│   └── .indexOn: [email, phone, businessId, status]
│
├── riderStats/{riderId}
│   ├── totalOrders, totalEarnings, deliveriesToday?, earningsToday?
│
├── businesses/{bid}
│   ├── name, email, phone, address, gstin, fssai, logo, cover
│   ├── commission: { percentage, fixed }
│   ├── theme: { primary, secondary, brandName, logoText }
│   ├── outlets/{oid}
│   │   ├── orders/{pushId}
│   │   │   ├── orderId, outletId, businessId, outletName
│   │   │   ├── status: OrderStatus (9-value enum), statusUpdatedAt, statusUpdatedBy
│   │   │   ├── customerName, phone, whatsappNumber, address, lat, lng
│   │   │   ├── items[]: { menuItemId, name, image, quantity, price, size, addons[] }
│   │   │   ├── subtotal, deliveryFee, total, discount, paymentMethod, paymentStatus
│   │   │   ├── deliveryOTP, riderId, riderName, riderPhone, assignedRider
│   │   │   ├── timestamps: createdAt, updatedAt, acceptedAt, arrivedAtRestaurantAt,
│   │   │   │   pickedUpAt, reachedDropAt, deliveredAt, estimatedMinutes
│   │   │   └── .indexOn: [createdAt, status, riderId, phone, type, orderId]
│   │   │
│   │   ├── dishes/{dishId}
│   │   │   ├── name, price, category, image, sizes{}, addons[], description
│   │   │   ├── isAvailable, stock, order, tags
│   │   │   └── .indexOn: [category, name, order]
│   │   │
│   │   ├── categories/{catId}
│   │   │   ├── name, image, order, addons[]
│   │   │   └── .indexOn: [order, name]
│   │   │
│   │   ├── settings/
│   │   │   ├── Store: { name, address, lat, lng, phone, hours, banner }
│   │   │   ├── Delivery: { feeSlabs[], riderAcceptanceRadius, backupCode, contactPhones[] }
│   │   │   ├── Bot: { imgPlaced, imgConfirmed, imgPreparing, imgCooked, imgReady, imgOut, imgDelivered }
│   │   │   └── Display: { theme, logo, color }
│   │   │
│   │   ├── inventory/{itemId}: { name, category, stock, threshold, unit }
│   │   ├── reviews/{pushId}: { rating, comment, customerName, phone, createdAt }
│   │   │   └── .indexOn: [createdAt, rating]
│   │   ├── feedbacks/{pushId}: (similar to reviews)
│   │   ├── settlements/{pushId}: { orderId, amount, settledBy, settledAt, status }
│   │   │   └── .indexOn: [settledStatus, createdAt]
│   │   ├── wallet/{txId}: { orderId, amount, type, description, timestamp }
│   │   ├── meta: { slug, logo, cover, rating, cuisine, tags, isVegOnly, featured, offers[] }
│   │   ├── botCommands/{pushId}: { action, phone, message, timestamp }
│   │   ├── botStatus: { lastSeen, status:"online"|"offline", outlet }
│   │   ├── botUsers/{jid}: { name, phone, address, orders }
│   │   ├── otpAttempts/{orderId}: { count, lastTry, blockedUntil, lastResend, resendCount }
│   │   ├── riderStats/{riderId}: (mirror of global riderStats)
│   │   ├── logs/audit/{pushId}: { action, details, actor, ts, clientTs }
│   │   └── metadata/orderSequence/{dateStr}: { seq: number } (atomic increment)
│   │
│   └── **.read: true (public for discovery)**
│   └── **.write: superadmin or assigned admin only**
│
├── system/
│   ├── settings/delivery: { mode, per100mRate, slabs[] }
│   ├── promotions/
│   │   ├── coupons/{code}: { discount, type, maxUses, usedCount, minOrder, expiresAt }
│   │   ├── surge: { multiplier, active, zones[] }
│   │   └── globalDiscount: { type, value, active }
│   ├── config/platformFee: { percent, fixed }
│   ├── broadcasts/{pushId}: { title, body, audience, sentAt }
│   ├── admins/{uid}/tfaSecret: { secret, verified, createdAt }
│   ├── auditLogs/{pushId}: (unified audit)
│   ├── settlements/{pushId}
│   ├── botSessions/{bid}/{oid}/{jid}: { step, cart, profile, lastActive }
│   ├── bot_routing/{phone}
│   │   ├── businessId, outletId, label, enabled, createdAt, sessionDir
│   │   └── **read/write**: superadmin only
│   ├── partners/{partnerId}: { name, type, contact, status, since }
│   └── report_logs/{bid}_{oid}/{slot}: { lastSent }
│
├── slug/outlets/{slug}: { businessId, outletId }
├── orders/{orderId}: { orderId, businessId, outletId, status, total, createdAt }
│   └── (global index — mirror of per-outlet orders)
│
├── users/{uid} (auth profile mirror)
│   ├── name, email, phone, avatar, savedAddresses[]
│   ├── wallet: { balance, history[] }
│   └── fcmToken
│
├── customers/{phone} (legacy alias for users/)
├── superAdmin/ (system-wide config — restricted read/write)
├── platformConfig/
├── Pizza-Shop/ (legacy read-only, deny write)
├── Cake-Shop/ (legacy read-only, deny write)
├── errorLogs/{timestamp}: { context, message, stack }
├── dishes/ (legacy read-only)
├── outlets/ (legacy read-only)
└── logs/
    ├── marketplaceAudit/{pushId}: { action, userId, details, timestamp }
    │   └── .indexOn: [userId, timestamp]
    ├── botAudit/{pushId}: { timestamp, action, details, whatsappJid, businessId, outletId }
    ├── audit/{pushId}
    ├── lostSales/{pushId}
    └── riderErrors/{riderId}/{timestamp}: { context, message, stack, url }
```

---

## Order Status Enum

```typescript
type OrderStatus =
  | "Placed"           // Customer submitted order
  | "Confirmed"        // Admin accepted order
  | "Preparing"        // Kitchen started cooking
  | "Cooked"           // Chef finished
  | "Ready"            // Packed and waiting for rider
  | "Out for Delivery" // Rider picked up
  | "Reached Drop Location" // Rider arrived
  | "Delivered"        // Completed
  | "Cancelled";       // Admin or system cancelled
```

## Rider Status Enum

```typescript
type RiderStatus = "Online" | "Offline" | "On Delivery";
```

## Multi-Tenant Invariant

Every order write **must** carry a `businessId` and `outletId`. No global "default business" exists. Enforced at TypeScript type level (`PlaceOrderInput.businessId` required), service level (`submitOrder` throws if empty), and bot level (`tenantContext` hard-fails if bid/oid unset).
