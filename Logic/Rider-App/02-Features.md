# Rider App — Features

## Core Delivery Flow
1. **New Order Ping** — Audio alert (`alert.mp3`) + full-screen modal with 30s countdown, customer address, delivery fee. Accept/Skip buttons.
2. **Accept Order** — Proximity-gated (1km from outlet). Firebase `runTransaction` for race-condition-safe assignment. Generates 4-digit OTP.
3. **Reached Outlet** — Slide-to-confirm with 1km proximity gate. Updates `arrivedAtRestaurantAt`.
4. **Verify Items** — Checklist modal for order items.
5. **Pickup** — 300m proximity gate. Updates status to "Out for Delivery".
6. **Navigation** — Opens Google Maps turn-by-turn to customer.
7. **Reached Drop** — Proximity-gated. Opens OTP panel.
8. **OTP Verification** — 4-digit code. 10-attempt rate limit with 60s block. Admin override. Regenerate with 60s cooldown.
9. **Payment** — Cash or UPI collection.
10. **Finalize** — Status → "Delivered", ledger entry, wallet update, confetti.

## Cross-Cutting Features
| Feature | Description |
|---|---|
| **Proximity Gating** | 1km accept, 300m pickup, configurable drop radius from outlet settings |
| **Offline Queue** | localStorage queue for ACCEPT_ORDER, UPDATE_STATUS, REACHED_OUTLET; syncs on reconnect |
| **OTP System** | 4-digit code, 10 attempts, 60s block, admin bypass, regenerate (60s cooldown) |
| **Route Optimization** | Nearest-neighbor heuristic for multi-order stops |
| **Real-time Location** | `watchPosition` (10s interval), writes to `riders/{uid}/location`, heartbeat + onDisconnect |
| **Multi-Outlet** | Loads all businesses/outlets; dynamically maps orders to correct path |
| **WhatsApp Integration** | Pushes commands to `botCommands` for order status messages to customers |
| **Notifications** | FCM push + in-app notification sheet + haptic/audio on new notification |
| **Seamless Loading** | Skeleton mode, version enforcement, nuclear refresh on version change |
| **Pull-to-Refresh** | Mobile gesture to reload data |
