# Rider App — Connecting Nodes

## View → App.js → Firebase Flow

```
[HTML View (section)]
  ↓ onclick="window.functionName()"
[app.js — global window.* functions]
  ↓ calls
[Firebase SDK (CDN v10.7.1)]
  ↓ reads/writes
[Firebase Realtime Database]
```

## Data Flow by Feature

### Accept Order Flow
```
sec-available view
  → Rider clicks "Accept" on order card
  → window.acceptOrder(orderId, outletId, bid)
  → app.js:
      1. Calculate distance from rider location to outlet
      2. Check proximity gate (≤1km)
      3. If offline → queue to localStorage
      4. If online → db.ref(path).transaction() for atomic assignment
      5. On success: generate 4-digit OTP, update order status
      6. Push to botCommands for WhatsApp notification
      7. Update rider status → "busy"
      8. Navigate to sec-active view
```

### Location Tracking Flow
```
app.js initLocationTracking():
  → navigator.geolocation.watchPosition(success, error, options)
  → success callback every 10 seconds:
      db.ref(`riders/${uid}/location`).set({ lat, lng, timestamp, heading, speed })
  → Also writes heartbeat: db.ref(`riders/${uid}/lastSeen`).set(Date.now())
  → onDisconnect: db.ref(`riders/${uid}/status`).set("offline")
```

### Order Ping Flow
```
app.js initOrderListener():
  → Listens on businesses/{bid}/outlets/{oid}/orders via child_added
  → Filter: order.status === "Placed" AND !order.assignedRider
  → Show #newOrderPingModal with 30s countdown
  → Play alert.mp3 vibration
  → Accept → proximity check + acceptOrder()
  → Skip/timeout → close modal, next ping
```

### OTP Verification Flow
```
sec-active view → step 3 (Reached Drop)
  → Rider clicks "Reached Drop Location"
  → Opens #otpPanel
  → Customer provides OTP code
  → Rider enters OTP
  → app.js:
      1. Read otpAttempts/{orderId}
      2. If blocked (blockedUntil > Date.now()) → reject
      3. If count ≥ 10 → block for 60s → reject
      4. Compare input with order.deliveryOTP
      5. Match → otpAttempts.verified = true, open paymentPanel
      6. No match → increment count, show error
      7. Regenerate: check 60s cooldown, new 4-digit code to Firebase
```

## Key Event Listeners in app.js
| Listener | Firebase Path | Purpose |
|---|---|---|
| `onAuthStateChanged` | Firebase Auth | Auth lifecycle |
| `onChildAdded` | `businesses/{}/outlets/{}/orders` | New orders for ping |
| `onChildChanged` | `businesses/{}/outlets/{}/orders` | Status updates for active trip |
| `onValue` | `riders/{uid}/notifications` | In-app notification list |
| `onValue` | `.info/connected` | Connection status |
| `watchPosition` | Browser GPS | Location tracking |
| `onNotificationClick` | Service Worker | Notification click handler |
| `onBackgroundMessage` | FCM SW | Background push messages |
