# Bot Status Monitor (status-monitor.js) — Code Logics

## Overview
Listens for order status changes in Firebase Realtime Database and sends WhatsApp notifications to customers and riders.

## Dependencies
- `./firebase` — db, admin, BUSINESS_ID, OUTLET_ID, resolvePath, getData
- `../shared/utils` — formatJid
- `../shared/push-notifications` — notifyAdmins

## State
| Variable | Type | Description |
|---|---|---|
| `processedStatus` | `{ [orderId]: { status, riderId, timestamp } }` | Dedup cache — prevents re-sending same notification |

## Listeners

### `child_added` (orders ref)
- Called for every existing order + new orders
- If order is older than 10 min (600000ms) → mark as processed, skip notification
- Otherwise → `handleStatusUpdate(sock, key, order, true)`

### `child_changed` (orders ref)
- Called when any order field changes
- Calls `handleStatusUpdate(sock, key, order)`

## Core Logic: `handleStatusUpdate(sock, orderId, order, isNew)`

### Dedup Check
- Compares current `order.status` + `order.riderId` against `processedStatus[orderId]`
- Skips if nothing changed

### Flow
1. **Rider change detected** → `notifyRiderAssignment()`
2. **New order (status=Placed)** →
   - Fetch `settings/Store.reportPhone`
   - Send WhatsApp message to admin
   - Call `notifyAdmins()` for FCM push notification
3. **Status change → customer notification**:
   - Extract customer JID from `order.whatsappNumber || order.phone`
   - Build message + optional image per status:
     - `Confirmed` → ✅ confirmation + imgConfirmed
     - `Preparing` → 👨‍🍳 + imgPreparing
     - `Cooked` → 🔥 + imgCooked
     - `Ready/Packed` → 📦 + imgReady
     - `Out for Delivery/Picked Up` → 🛵 with OTP + invoice + rider details
     - `Reached Drop Location` → 📍 with OTP
     - `Delivered` → ✅ + imgDelivered
     - `Cancelled` → ❌
4. **Rider broadcast** — if no rider assigned AND status is Cooked/Ready/Packed → `broadcastPickupAvailable()`

## Helpers

### `getOrderItems(order)`
Returns items array from `order.cart` or `order.items` (handles both array and object formats)

### `notifyRiderAssignment(sock, orderId, order)`
- Sends detailed WhatsApp message to rider with items, total, customer info, Google Maps link
- Also creates in-app notification via `riders/{riderId}/notifications/{notifId}`

### `broadcastPickupAvailable(sock, orderId, order)`
- Fetches all riders, filters to `status === "online"`
- Sends broadcast message to each with order details
- Creates in-app notification for each rider

### `addRiderNotification(riderId, title, body)`
- Writes `{ id, title, body, type: "order", icon: "package", timestamp, read: false }` to `riders/{riderId}/notifications/{notifId}`
