# Rider App — Vanilla JS PWA

**URL**: `foodhubbie-rider.web.app`  
**Stack**: Vanilla JS ES6 modules + Firebase modular SDK v10.7.1 (Auth, RTDB, Storage, FCM) + Leaflet.js  
**Source**: `RiderApp/app.js` (3031 lines), `RiderApp/index.html` (654 lines)  
**Hosting target**: `rider` → `RiderApp/`

---

## 1. Code-Logics

### App Entry
```
index.html (654L) — SPA shell with:
  - CSP headers (connect-src to firebaseio, googleapis, osm tiles)
  - Seamless Loading Engine (skeleton mode from localStorage)
  - Version enforcement (rider_app_version against "4.7.1")
  - All views defined as <div id="view-{name}"> (7 views)
  - 10+ modal containers (OTP, Payment, Ping, Settlement, etc.)
```

```
app.js (3031L) — Full app logic:
  - Firebase init (App Check omitted — Spark plan)
  - 7 view renderers (Home, Available, Active, Completed, Ledger, Earnings, Profile)
  - Auth flow (login via {phone}@rider.com convention)
  - GPS tracking (watchPosition, 10s interval)
  - OTP system (4-digit, 10-attempt rate limit, admin bypass)
  - Offline queue (localStorage, auto-sync on online)
  - FCM foreground/background handling
  - WhatsApp integration via bot/{bid}/{oid}/commands
  - Settlement history modal
  - Nuclear refresh (clear all caches, unregister SW)
```

### 7 Views

| View | UI | Key logic |
|---|---|---|
| **Home** (`#view-home`) | 2x2 stat grid (Green Delivered, Blue On-Time, Orange Earnings, Gold Rating), active delivery card, step progress bar | `todayStats()`, `loadActiveOrder()`, `renderStats()` |
| **Available** (`#view-available`) | Order cards with ACCEPT, Ping modal (30s timer, audio alert) | `loadAvailableOrders()`, `handleOrderAccept()` → `runTransaction` |
| **Active** (`#view-active`) | Leaflet map (rider + customer markers), task card, slide-to-action buttons, item checklist | `renderActiveTrip()`, `stageReachedOutlet()`, `stageConfirmPickup()`, `stageReachedDrop()` |
| **Completed** (`#view-completed`) | Order history list, search by Order ID | `loadCompletedOrders()`, `filterOrders()` |
| **Ledger** (`#view-ledger`) | Balance hero, transaction history, filter pills | `loadLedger()`, `renderTransactions()` |
| **Earnings** (`#view-earnings`) | Today's hero, weekly chart (recharts), shop breakdown, settlement button | `loadEarnings()`, `renderWeeklyChart()` |
| **Profile** (`#view-profile`) | Photo upload, personal details, Aadhar show/hide, status toggle | `loadProfile()`, `editField()`, `toggleStatus()` |

### Modals (10+)
| Modal | Trigger | Content |
|---|---|---|
| `#pingModal` | New order arrives (status="Ready" and not assigned) | Full-screen: outlet, order ID, address, 30s countdown, ACCEPT/SKIP |
| `#otpPanel` | Rider reaches drop location | 4-digit input, REGENERATE button (60s cooldown), EMERGENCY OVERRIDE (admin-only), VERIFY |
| `#paymentPanel` | OTP verified | Total display, CASH/UPI buttons |
| `#successOverlay` | Delivery complete | Confetti animation (canvas-confetti), "DELIVERED!", BACK button, auto-close 4s |
| `#settlementModal` | Earnings page "History" | Settlement records: admin, amount, orders cleared, timestamp |
| `#notifSheet` | Bell icon | Notifications list, Clear All |
| `#verificationModal` | Pickup | Item checklist (name + qty + checkbox), ORDER PICKED UP button |

### Proximity Gating (Two-Stage)
| Gate | Radius | Verified at |
|---|---|---|
| Accept order | 1000m from outlet | `handleOrderAccept()` |
| Reach outlet | 1000m | `stageReachedOutlet()` |
| Confirm pickup | 300m | `stageConfirmPickup()` |

---

## 2. Firebase-Rules

| Path | Access |
|---|---|
| `riders/{uid}/*` | Rider self-read/write, admin read/write |
| `riders/{uid}/kycStatus` | Superadmin only |
| `riders/{uid}/verified` | Superadmin only |
| `businesses/{bid}/outlets/{oid}/orders/{id}` | Rider write if `newData.riderId == auth.uid` |
| `riderStats/{riderId}` | Rider self-write |
| `otpAttempts/{orderId}` | Rider write (rate-limited by client) |
| `logs/riderErrors/{riderId}` | Any authenticated user |
| `settlements/{riderId}` | Admin + rider read |

---

## 3. Database-Structure

**Rider profile** (`riders/{uid}`):
```
name, fatherName, age, aadharNo (masked), aadharPhoto (URL)
qualification, phone, address, profilePhoto
status: "Online"|"Offline", lastSeen, fcmToken
businessId, isAdmin (OTP override)
wallet: { balance, totalEarned, lastTx, lastTxAt }
ledger/{txId}: { txId, orderId, amount, type, description, timestamp, outlet, method }
notifications/{notifId}: { title, body, timestamp, read, type, icon }
location: { lat, lng, accuracy, ts, lastUpdate, signalLost? }
```

**Order** (rider-facing fields):
```
assignedRider, riderId, riderPhone, acceptedAt
status: OrderStatus (9)
deliveryOTP (4-digit), otpVerifiedAt
rider delivery timestamps: arrivedAtRestaurantAt, pickedUpAt, reachedDropAt, deliveredAt
```

---

## 4. Connecting-Nodes

```
[Rider logs in with {phone}@rider.com]
  -> Firebase Auth signInWithEmailAndPassword
  -> onAuthStateChanged -> load rider profile from riders/{uid}
  -> Check app version (4.7.1) — mismatch triggers nuclear refresh
  -> Start GPS (watchPosition, 10s write to riders/{uid}/location)
  -> onDisconnect handler: auto-set status="Offline"
  -> Initialize FCM: getToken() -> store at riders/{uid}/fcmToken
  -> onMessage (foreground) -> create in-app notification + audio alert

[Order acceptance]:
  Available order appears -> rider taps ACCEPT
    -> proximity check (Haversine: ≤1000m from outlet)
    -> runTransaction on businesses/{bid}/outlets/{oid}/orders/{id}
      -> sets assignedRider, riderId, riderPhone, deliveryOTP, acceptedAt
    -> push command to bot/{bid}/{oid}/commands: SEND_GENERIC_MESSAGE "accepted"
    -> WhatsApp to customer: "I am your delivery partner..."

[Delivery completion]:
  Rider taps CASH/UPI in paymentPanel
    -> runTransaction on riders/{uid}/wallet
      -> balance += deliveryFee, totalEarned += deliveryFee
    -> push to riders/{uid}/ledger/{txId}
    -> update order: status="Delivered", deliveredAt, paymentCollected, paymentMethod
    -> update riderStats/{riderId}: totalOrders++
    -> confetti animation + success overlay
```

---

## 5. Complete-Flow: Delivery Lifecycle

1. Rider goes **Online** → GPS starts, `riders/{uid}/status = "Online"`
2. Available orders appear (status="Ready", unassigned, within 1km)
3. New order arrives → **Ping Modal** with 30s countdown + audio alert
4. Rider accepts → proximity check (1km) → OTP generated → WhatsApp to customer
5. **Active Trip** view: Leaflet map with rider/customer markers, 4-step progress
6. Rider reaches outlet → slide "SLIDE TO REACH OUTLET" (1km gate)
7. Rider picks up → verification modal (item checklist) → slide "SLIDE TO PICK UP" (300m gate)
8. Rider navigates to customer → slide "SLIDE TO REACH CUSTOMER"
9. **OTP Verification**: customer provides 4-digit code. 10 failed = 60s block.
10. **Payment Collection**: Cash or UPI → wallet transaction → order marked "Delivered"
11. **Success**: confetti (150 particles, orange/green), auto-close after 4s, rider stats updated
