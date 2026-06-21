# Order Status Monitor — WhatsApp Notification Engine

**Source**: `bot/status-monitor.js` (307 lines)  
**Dependency**: Called from `multi-tenant.js` → `initStatusMonitor(sock, tenant)`  
**Purpose**: Listens to order status changes in Firebase, sends real-time WhatsApp messages to customers and riders

---

## 1. Code-Logics

### Architecture

```javascript
function initStatusMonitor(sock, tenant) {
  const t = tenantContext(tenant);
  const ordersPath = t.resolvePath('orders');
  const processedStatus = {};  // per-tenant dedup map

  orderRef.on('child_added', (snap) => { ... });
  orderRef.on('child_changed', (snap) => { ... });
}
```

### Status Handler Dispatch

`handleStatusUpdate()` routes the order to the correct handler based on the `status` field:

| Status | Handler | Customer message |
|---|---|---|
| `Placed` | `handlePlaced()` | No WhatsApp (order just created by Marketplace/bot) |
| `Confirmed` | `handleConfirmed()` | "Your order #{id} has been confirmed!" + invoice image |
| `Preparing` | `handlePreparing()` | "Now in the kitchen!" with preparing image |
| `Cooked` | `handleCooked()` | "Chef has finished cooking!" with cooked image |
| `Ready` | `handleReady()` | "Packed and waiting for rider!" + rider notification |
| `Out for Delivery` | `handleOutForDelivery()` | Rider info + 4-digit OTP + out-for-delivery image |
| `Reached Drop Location` | `handleReachedDrop()` | "Rider has arrived!" + OTP reminder |
| `Delivered` | `handleDelivered()` | "Enjoy your meal!" + food joke + delivered image |
| `Cancelled` | `handleCancelled()` | Apology with reason |

### Rider Notification

- **Rider Assignment**: When `order.riderId` changes → WhatsApp to rider with full invoice + customer location + Google Maps link
- **Pickup Ready**: When status="Ready" and rider assigned → pickup notification with OTP
- **Broadcast**: When status="Ready" but no rider assigned → broadcast to ALL online riders (status==="Online")

### Admin Notifications

- **New Order**: Full order details to all admin JIDs
- **Cancelled Order**: Lost-sale notification with potential revenue
- **Low Stock Alert**: When inventory item falls below threshold (checked on order placement)

### Dedup Map
```javascript
const processedStatus = {
  [orderId]: { status, riderId, timestamp }
};
// Orders older than 10 min are skipped on initial load
if (Date.now() - createdAt > 600000) {
  processedStatus[snap.key] = { ... };
  return;
}
```

---

## 2. Firebase-Rules

Same as Bot Engine — Admin SDK bypasses RTDB rules for all order-related reads/writes.

---

## 3. Database-Structure

The monitor **reads** from `businesses/{bid}/outlets/{oid}/orders/{pushId}` and **writes** bot commands to `bot/{bid}/{oid}/commands` (for WhatsApp dispatch).

---

## 4. Connecting-Nodes

```
[Order status changes in Firebase]
  -> child_changed event on businesses/{bid}/outlets/{oid}/orders/{id}
  -> handleStatusUpdate(sock, orderId, orderData, t, tenant, processedStatus, isNew)
     -> Check dedup: processedStatus[orderId].status === order.status? skip
     -> Route to handler based on order.status:
          -> build message text + select image URL from settings/Bot/{status}
          -> sendMessage(customerJid, { text, image })
     -> If rider assigned:
          -> build rider message + Google Maps link
          -> sendMessage(riderJid, { text })
          -> sendPushNotification(admin, fcmToken, payload)
     -> If no rider:
          -> iterate all riders: status==="Online" -> send broadcast
     -> Send admin WhatsApp notification
     -> processedStatus[orderId] = { status, riderId, timestamp }
     -> logBotAudit('STATUS_NOTIFIED', { orderId, status }, ...)
```

---

## 5. Complete-Flow: Ready Status Notification

1. Admin updates order status to "Ready" in Admin Dashboard
2. `child_changed` fires in Firebase
3. `handleReady()` executes:
   - If `order.riderId` exists → sends WhatsApp to rider with pickup info + OTP
   - If no `riderId` → queries `riders/` for all with `status==="Online"`
     - Broadcasts to each: "New order ready for pickup! #{orderId} from {outletName}"
   - Sends WhatsApp to customer: "Packed and waiting for rider!"
4. Processed status marked: `processedStatus[orderId] = { status: "Ready", ... }`
5. Duplicate `child_changed` events with same status are ignored
