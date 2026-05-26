# Shared — Connecting Nodes

## How All Apps Connect Through Firebase

The shared module acts as the **bridge** between all components of the Foodhubbie ecosystem.

---

## Node Connection Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Realtime DB                      │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │ Admin Dash│  │    Bot    │  │ Rider App │  │Marketplace│ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬─────┘ │
│        │              │              │              │        │
│  ┌─────┴──────────────┴──────────────┴──────────────┴─────┐ │
│  │                   resolvePath()                         │ │
│  │         shared/firebase-helpers.js                      │ │
│  └─────────────────────────┬───────────────────────────────┘ │
│                            │                                 │
│              ┌─────────────┴─────────────┐                   │
│              │                           │                   │
│              ▼                           ▼                   │
│  ┌───────────────────┐       ┌───────────────────────┐      │
│  │  Global Nodes      │       │  Tenant-Scoped Nodes  │      │
│  │  (root level)      │       │  businesses/{biz}/    │      │
│  │                    │       │  outlets/{outlet}/    │      │
│  │  admins/{uid}      │       │                       │      │
│  │  riders/{id}       │       │  orders/{id}          │      │
│  │  platformConfig    │       │  dishes/{id}          │      │
│  │  superAdmin/{uid}  │       │  categories/{id}      │      │
│  │  bot/{biz}/{outlet}│       │  metadata             │      │
│  └───────────────────┘       └───────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## How Each App Resolves Paths

### Admin Dashboard (App.jsx)

```javascript
// Module-level globals set on login
let _bizId = null, _outletId = null;

// Outlet() helper — constructs Firebase ref for current outlet
function Outlet(path) {
  return _bizId && _outletId
    ? ref(db, `businesses/${_bizId}/outlets/${_outletId}/${path}`)
    : null;
}

// Usage: Outlet("orders") → ref to businesses/{biz}/outlets/{outlet}/orders
// Usage: Outlet("dishes/dish123") → ref to businesses/{biz}/outlets/{outlet}/dishes/dish123
```

### Bot (Node.js — status-monitor.js / commands.js)

```javascript
// Uses shared/firebase-helpers.js
const { resolvePath } = require('../shared/firebase-helpers');
const BUSINESS_ID = config.businessId;
const OUTLET_ID = config.outletId;

// resolvePath("orders/abc123", BUSINESS_ID, OUTLET_ID)
// → "businesses/{BUSINESS_ID}/outlets/{OUTLET_ID}/orders/abc123"
```

### Rider App (app.js)

```javascript
// Similar pattern using resolvePath from shared
const riderRef = db.ref(`riders/${riderId}`);
const orderRef = resolvePath(`orders/${orderId}`, businessId, outletId);
```

### Shared Library (firebase-helpers.js)

```javascript
// resolvePath() is the single source of truth for path construction
// Called by all apps with their businessId/outletId
function resolvePath(path, businessId, outletId) {
  // 1. Check for special aliases (botCommands)
  // 2. Check for global nodes (admins, riders, etc.)
  // 3. Otherwise: businesses/{businessId}/outlets/{outletId}/{path}
}
```

---

## Data Write Flow Example (POS Checkout)

```
POSPage (Admin Dashboard)
  │
  ├─ onValue(Outlet("dishes"))        ──→ /businesses/{biz}/outlets/{outlet}/dishes
  ├─ onValue(Outlet("categories"))    ──→ /businesses/{biz}/outlets/{outlet}/categories
  │
  ├─ get(Outlet("metadata/orderSequence"))  ──→ /.../outlets/{outlet}/metadata/orderSequence
  │
  ├─ set(Outlet("orders/{orderId}"), data)  ──→ /.../outlets/{outlet}/orders/{orderId}
  ├─ update(Outlet("metadata/orderSequence"), seqNum)
  │
  └─ update(Outlet("dishes/{dishId}"), { stock: newStock })
       ──→ /.../outlets/{outlet}/dishes/{dishId}
       
  Bot (status-monitor.js listens)
  │
  └─ on("child_changed", "/.../outlets/{outlet}/orders")
       ──→ Detects new/updated order
       ──→ Sends WhatsApp message to customer
       ──→ Broadcasts to riders if status === "Ready"
       ──→ Assigns rider notification if riderId changed
```

---

## Data Write Flow Example (Bot WhatsApp Order)

```
Customer WhatsApp message
  │
  ├─ Bot index.js receives message
  ├─ commands.js processes order intent
  │
  ├─ set(resolvePath("orders/{orderId}", biz, outlet), orderData)
  │   ──→ /businesses/{biz}/outlets/{outlet}/orders/{orderId}
  │
  ├─ update(resolvePath("botUsers/{phone}", biz, outlet), userProfile)
  │
  └─ status-monitor.js picks up the change (if in same process)
```

---

## Authentication Flow

```
App Login
  │
  ├─ signInWithEmailAndPassword(auth, email, password)
  │
  ├─ get(ref(db, "admins/" + user.uid))
  │   ──→ Reads /admins/{uid} for businessId/outletId
  │
  ├─ _bizId = d.businessId, _outletId = d.outletId
  │
  └─ All subsequent Outlet() calls use these globals
      → All reads/writes are scoped to this business + outlet
```

---

## Path Resolution Summary

| App | Business/Outlet Source | Resolver |
|---|---|---|
| Admin Dashboard | `_bizId`, `_outletId` globals (set on login) | `Outlet()` helper in App.jsx |
| Bot (Node.js) | `config.businessId`, `config.outletId` | `resolvePath()` from shared |
| Rider App | From admin/assignment data | Custom path building |
| Marketplace | From URL params or user context | `resolvePath()` from shared |
