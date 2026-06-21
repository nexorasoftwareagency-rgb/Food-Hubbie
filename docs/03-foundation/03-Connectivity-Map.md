# Connectivity Map — End-to-End Wiring

How every app, service, and user connects through the Firebase Realtime Database to form the full order lifecycle.

---

## 1. Code-Logics

### System Context Diagram

```
[CUSTOMER]───Browser──→[Marketplace PWA]───Firebase SDK──→[Firebase RTDB]
     │                                                         │  ↑
     │──WhatsApp──→[Baileys Socket]←───Admin SDK──→[Bot (EC2)]──┘  │
     │                                                         │     │
     │                                                         ├─ [Admin Dashboard] ←──Firebase SDK──→[SHOP ADMIN]
     │                                                         ├─ [Rider App] ←───Firebase SDK──────→[RIDER]
     │                                                         ├─ [SuperAdmin] ←───Firebase SDK─────→[SUPER ADMIN]
     │                                                         └─ [SupremeAdmin] ←──Firebase SDK───→[SUPREME ADMIN]
```

### Data Flow Directions

| App | Firebase SDK | Service | Typical writes | Typical reads |
|---|---|---|---|---|
| Marketplace | modular v12.13.0 | Auth, RTDB, Storage, FCM | orders, reviews, users/cart | businesses, outlets, dishes, orders status |
| Admin Dashboard | modular v12.13.0 | Auth, RTDB, Storage + App Check | orders status, menu, riders, settings | orders real-time, riders, analytics |
| Rider App | modular v10.7.1 | Auth, RTDB, Storage, FCM | orders (accept), rider profile, GPS location | available orders, assigned order, wallet |
| SuperAdmin | compat v9.6.1 | Auth, RTDB, Storage | businesses, outlets, onboarding, promotions | audit logs, analytics, rider stats |
| SupremeAdmin | compat v11.4.0 | Auth, RTDB, Firestore, Functions | settlements, broadcasts, user wallets | system-wide aggregates |
| Bot | Admin SDK v13.10.0 | RTDB (server-side) | orders (via state machine), botStatus, botUsers | orders (status changes), dishes, settings |

---

## 2. Firebase-Rules — Cross-App Access

| Path | Marketplace | Admin Dashboard | Rider | SuperAdmin | SupremeAdmin | Bot (Admin SDK) |
|---|---|---|---|---|---|---|
| businesses/{bid} | read | read/write | read | read/write | read/write | read/write |
| businesses/{bid}/outlets/{oid}/orders | create | read/write | read/write (assigned) | read | read | read/write |
| businesses/{bid}/outlets/{oid}/dishes | read | read/write | read | read | read | read |
| businesses/{bid}/outlets/{oid}/settings | read | read/write | read | read/write | read | read |
| businesses/{bid}/outlets/{oid}/inventory | — | read/write | — | read | read | read/write |
| riders/{uid} | — | read/write | read/write | read/write | read | read |
| users/{uid} | read/write | read | — | read | read/write | — |
| admins/{uid} | — | read | — | read | read | read |
| system/ | — | — | — | read/write | read/write | read/write |
| logs/ | write (marketplaceAudit) | write (audit) | write (riderErrors) | read | read/write | write (botAudit) |

---

## 3. Database-Structure

The full canonical tree is documented in `docs/00-master/00-DATA-MODEL.md`. Every app accesses the same RTDB instance at `https://food-hubbie-default-rtdb.firebaseio.com`.

---

## 4. Connecting-Nodes — Order Lifecycle Wire Diagram

```
[CUSTOMER places order via Marketplace /checkout]
  1. Checkout.tsx → handlePlaceOrder()
  2. orderService.submitOrder()
  3. push() to businesses/{bid}/outlets/{oid}/orders/{pushId}
  4. RTDB write triggers child_added

[Admin Dashboard live-listener receives order]
  5. admin-dashboard: onValue('orders') → new order appears in Dashboard
  6. Admin opens Orders tab → sees priority order card
  7. Admin confirms: update({ status: "Confirmed" })
  8. RTDB child_changed → sends confirmation to Marketplace tracking page

[Bot status-monitor picks up status change]
  9. bot: child_changed event fires
  10. handleStatusUpdate() routes based on new status
  11. Sends WhatsApp message to customer: "Your order has been confirmed!"
  12. Sends WhatsApp to admin: report notification

[Kitchen prepares → Admin updates to "Ready"]
  13. Admin: update({ status: "Ready" })
  14. bot: handleReady() → broadcasts to all online riders via WhatsApp
  15. Rider App: ping modal (30s timer + audio alert)

[Rider accepts order]
  16. Rider: runTransaction on orders/{id}
  17. Sets assignedRider, riderId, riderPhone, deliveryOTP, acceptedAt
  18. Bot: push command to bot/{bid}/{oid}/commands → SEND_GENERIC_MESSAGE
  19. WhatsApp to customer: "I am your delivery partner..."

[Rider delivers order]
  20. Rider marks status="Delivered"
  21. runTransaction on riders/{uid}/wallet (balance + deliveryFee)
  22. push to riders/{uid}/ledger/{txId}
  23. Bot: sends "Enjoy your meal!" + food joke to customer
  24. Success overlay + confetti on Rider App

[Next day — SuperAdmin reconciles]
  25. SuperAdmin opens Reconciliation tab
  26. Reads orders with status="Delivered" for date range
  27. Matches delivery fees against rider settlements
  28. Processes manual payout → updates settlements/{pushId}
```

---

## 5. Complete Flow: Customer Orders via WhatsApp Bot

```
[CUSTOMER messages WhatsApp bot number]
  1. Baileys socket receives "messages.upsert" event
  2. multi-tenant.js routes to correct tenant engine via phone number lookup
  3. whatsapp-engine.js state machine processes message:
     - Welcome → Category → Dish → Size → Quantity → Cart → Checkout
  4. On "Confirm": order pushed to businesses/{bid}/outlets/{oid}/orders/{pushId}
  5. RTDB child_added → admin dashboard receives order
  6. Admin updates status → bot sends WhatsApp progress updates to customer
  7. Rider assigned → WhatsApp + FCM notification to rider
  8. Rider delivers → status="Delivered" → success message to customer

[Offline resilience]
  - Bot: Firebase Admin SDK has built-in offline persistence
  - Rider App: localStorage queue for failed actions, auto-syncs on reconnect
  - Admin Dashboard: onValue auto-reconnects via Firebase SDK
  - Marketplace: TanStack React Query caches + retries
```
