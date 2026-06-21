# Multi-Tenant Bot Engine — WhatsApp Ordering State Machine

**Runtime**: Node.js 18+ CommonJS, EC2 (Ubuntu) + PM2  
**Key libs**: `@whiskeysockets/baileys` v6.7.17, `firebase-admin` v13.10.0, `pino`  
**Source**: `bot/index.js` → `bot/multi-tenant.js` (186 lines) → per-tenant engine  
**PM2**: Single process (`foodhubbie-bot`), 600M max memory, exp-backoff restart

---

## 1. Code-Logics

### Entry Point Chain
```
index.js (14L)           — require('./multi-tenant')
  |
  v
multi-tenant.js (186L)   — orchestrator
  |-- loadRegistry()     — reads system/bot_routing/ from Firebase (6 retries × 10s)
  |-- bootTenant(t)      — for each enabled tenant:
       |-- makeWASocket()      — Baileys socket (multi-device)
       |-- createEngine(t)     — whatsapp-engine state machine
       |-- initStatusMonitor() — order listener
       |-- initCommandListener — admin commands
       |-- registerReportsCron — scheduled reports
  |-- handleDisconnect() — per-socket reconnect (5s→15s→45s→120s max)
```

### Registry Schema (`system/bot_routing/`)
```json
{
  "919876543210": {
    "businessId": "business_roshani",
    "outletId": "outlet_pizza",
    "label": "Roshani Pizza Bot",
    "enabled": true,
    "createdAt": "2026-06-01T12:00:00Z"
  }
}
```

### State Machine (`whatsapp-engine.js`, 706 lines)

11 discrete steps with per-session persistence:

```
START
  → Welcome message + category list
  → User replies with number
CATEGORY
  → Fetch categories from businesses/{bid}/outlets/{oid}/categories
  → Show numbered list (1. Classic Pizzas, 2. Premium...)
  → User replies with number
DISH
  → Fetch dishes filtered by category
  → Show numbered list with prices
  → Special commands: 9=View Cart, 0=Back, RESET/CANCEL=Clear
SIZE
  → Show size options (Regular/Medium/Large + prices)
  → User picks size
ADDONS
  → Show add-ons for this dish (Extra Cheese, etc.)
  → User picks add-on or skips
QUANTITY
  → User enters quantity (1–50, validated)
  → Add to cart → show cart summary
CART_VIEW / ADDED_TO_CART
  → Options: 1=Add more, 2=Checkout, 3=Clear cart
  → If checkout: check if user profile exists
LOCATION / REUSE_PROFILE
  → If no saved profile: ask Name → Phone → Address
  → If saved profile: offer to reuse or update
  → User shares live WhatsApp location (lat/lng)
  → Calculate delivery fee via Haversine + slabs
CONFIRM_PAY
  → Show invoice (items, delivery fee, total)
  → User: 1=Confirm, 2=Cancel
  → Payment method selection (COD/UPI)
PLACE_ORDER
  → Submit order to businesses/{bid}/outlets/{oid}/orders/{pushId}
  → Deduct inventory stock
  → Send "Thank you, order placed!" to customer
  → Notify admins (WhatsApp + FCM)
```

### Session Cache (per-engine, Map with 30min TTL)
```javascript
const SESSION_TTL_MS = 30 * 60 * 1000;
const sessionCache = new Map();
// Periodic cleanup every 10 minutes
setInterval(() => {
  for (const [jid, entry] of sessionCache) {
    if (Date.now() > entry.expiry) sessionCache.delete(jid);
  }
}, 10 * 60 * 1000);
```

### Global Discovery Mode
When `FOODHUBBIE_MODE=global`:
- `user.activeBid` / `user.activeOutlet` override the bot's default tenant
- User can browse 20+ shops within 10km (Haversine-filtered)
- After selecting a shop, flow continues normally with that shop's menu

---

## 2. Firebase-Rules

| Path | Bot access |
|---|---|
| `businesses/{bid}/outlets/{oid}/orders` | Read/write via Admin SDK (service account) |
| `businesses/{bid}/outlets/{oid}/dishes` | Read via Admin SDK |
| `businesses/{bid}/outlets/{oid}/categories` | Read via Admin SDK |
| `businesses/{bid}/outlets/{oid}/settings` | Read via Admin SDK |
| `businesses/{bid}/outlets/{oid}/inventory` | Read/write via Admin SDK |
| `businesses/{bid}/outlets/{oid}/botCommands` | Read/write via Admin SDK |
| `businesses/{bid}/outlets/{oid}/botStatus` | Read/write via Admin SDK |
| `businesses/{bid}/outlets/{oid}/botUsers` | Read/write via Admin SDK |
| `system/bot_routing/` | Read via Admin SDK |
| `system/botSessions/` | Read/write via Admin SDK |
| `system/report_logs/` | Read/write via Admin SDK |
| `logs/botAudit` | Write via Admin SDK |
| `logs/` | Read via Admin SDK |

The bot uses **Firebase Admin SDK** (service account), so all database rules are bypassed. Security is delegated to the bot's own code.

---

## 3. Database-Structure

**Bot-specific nodes:**
```
businesses/{bid}/outlets/{oid}/
  botCommands/{pushId}
    action: "SEND_GENERIC_MESSAGE" | "SEND_DAILY_REPORT" | etc.
    phone, message, timestamp
  botStatus
    lastSeen, status: "online"|"offline"|"disconnected", outlet
  botUsers/{cleanJid}
    name, phone, address, location, createdAt, orderCount
  metadata/orderSequence/{dateStr}
    seq: number (atomic increment for order IDs)

system/
  bot_routing/{phone}
    businessId, outletId, label, enabled, createdAt, sessionDir
  botSessions/{bid}/{oid}/{safeJid}
    step, cart[], profile{}, lastActive
  report_logs/{bid}_{oid}/{slot}
    lastSent (timestamp)
logs/
  botAudit/{pushId}
    timestamp, action, details, whatsappJid, businessId, outletId
```

---

## 4. Connecting-Nodes

```
[Bot boots]
  -> multi-tenant.js: loadRegistry() -> Firebase
  -> per enabled tenant:
       -> Read Baileys session from session_data_{phone}/ (multi-file auth)
       -> If no session: print QR code to terminal
       -> makeWASocket() -> connect to WhatsApp Web
       -> createEngine(tenant):
            -> Bind t = tenantContext(tenant) -> scoped resolvePath
            -> Create sessionCache (Map with 30min TTL)
            -> Attach "messages.upsert" handler
       -> initStatusMonitor(sock, tenant):
            -> onValue businesses/{bid}/outlets/{oid}/orders
            -> child_added + child_changed -> handleStatusUpdate()
       -> initCommandListener(sock, tenant):
            -> onValue businesses/{bid}/outlets/{oid}/botCommands
       -> registerReportsCron(sock, tenant):
            -> setInterval(60s) -> check IST schedule -> send reports

[Customer sends message]
  -> "messages.upsert" event -> extract JID + text
  -> lookup sessionCache(jid) -> determine current step
  -> route to step handler (START, CATEGORY, DISH, etc.)
  -> Handler executes: reads from Firebase, sends response via sock.sendMessage()
  -> Session updated in cache (persisted to system/botSessions/ every 30s)
```

---

## 5. Complete-Flow: Customer Orders via WhatsApp

1. Customer messages WhatsApp bot number
2. Bot responds with welcome + category list (fetched from Firebase)
3. Customer selects category → sees dishes with prices
4. Customer selects dish → selects size → add-ons → quantity
5. Item added to cart → cart summary shown (1=Add more, 2=Checkout, 3=Clear)
6. Customer chooses Checkout → profile flow (name, phone, address, location)
7. Location shared (lat/lng) → Haversine distance → delivery fee calculated
8. Full invoice shown (items, fees, total) → 1=Confirm, 2=Cancel
9. Customer confirms → order pushed to Firebase
10. Inventory deducted (match item names against `inventory/`)
11. Customer receives "Thank you!" → Admin receives new-order notification
12. Bot listens for status changes → sends progress updates to customer
13. On delivery: success message + food joke

---

## 6. Discount Engine (bot/discount-engine.js, 171 lines)

Bot-side discount evaluator. Mirrors Admin's `discount-evaluator.js` but uses `firebase-admin`.

### Key Functions
| Function | Purpose |
|---|---|
| `evaluateDiscount({ OUTLET, customer, subtotal, couponCode, cart })` | Returns best applicable discount or null |
| `validateCouponCode(OUTLET, code)` | Validates customer-entered coupon against `discounts/*` |
| `recordDiscountUsage({ ... })` | Writes `discountsUsage/` + atomic `runTransaction` on `stats` |
| `formatDiscountLine(discount)` | Returns `"🎁 Discount (Name): -₹50\n"` for invoice |

### Discount Types
- **global** — applies to all orders
- **firstOrder** — new customers only (`!customers/{phone}`)
- **category** — specific menu categories
- **coupon** — customer enters code at checkout

### Integration
- AWAIT_COUPON step in bot state machine (between CART_VIEW and CONFIRM_PAY)
- `processOrderPlacement` calls `evaluateDiscount()` after subtotal, before total
- `user.discount` populated (was dead code before v4.14.8)

See `Logic/Bot/Discount-Engine/` for full documentation.

---

## 7. Promotions Module (bot/index.js additions)

Bot-side campaign executor. Receives `SEND_PROMOTION` commands from Admin via Firebase.

### Key Functions
| Function | Purpose |
|---|---|
| `runPromotionCampaign(sock, cmd)` | Main loop: walks recipients with 2s delay |
| `sendPromotionalMessage(sock, jid, text, mediaUrl)` | Bypasses `appendContactInfo`, adds opt-out footer |
| `personalizeTemplate(tpl, phone, campaignId, couponCode)` | Token replacement ({name}, {phone}, etc.) |

### Safety Features
- Kill-switch (`bot/{outlet}/promotions/killSwitch`)
- Concurrency lock (one campaign per outlet)
- Quiet hours (default 10:00–21:00 IST)
- Per-send socket health check
- Crypto-error auto-pause (>100)
- Resume on bot restart from RTDB

### STOP/START Handler
- `STOP | unsubscribe | opt-out` → adds to opt-out list
- `START` → re-opts-in

See `Logic/Bot/Promotions/` for full documentation.
