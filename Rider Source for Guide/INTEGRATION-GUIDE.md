# FoodHubbie Rider App — Production Build v5.0.0
## Integration, Deployment & Cutover Guide

> Full React 19 + TypeScript + Vite rebuild of `RiderApp/`, replacing the vanilla-JS
> PWA (v4.7.1) per `RIDER-APP-MASTER-PRD.md`. Real Firebase (`food-hubbie`), real
> react-leaflet maps, real business logic — no mock data anywhere in this build.

**Status:** `npx tsc --noEmit` — 0 errors. `npm run build` — succeeds, 0 warnings. Re-verified after a second, independent audit pass (see §4).
**Files:** 123 source files across contexts / hooks / services / components / pages.
**Deliverables:** `RiderApp-source.zip` (drop-in replacement source), `RiderApp-dist-prebuilt.zip` (already-built, deploy-ready `dist/`).

---

## 1. What's inside

Every screen from the approved UI/UX preview is implemented and wired to real Firebase — nothing is mocked:

| Area | What's real |
|---|---|
| **Auth** | Firebase Auth, phone→`@rider.com` email convention, session persistence, disconnect handlers |
| **Dashboard** | Live stats from `riderStats/{uid}` + `riders/{uid}/ledger`, real on-time % computed from actual `acceptedAt`/`deliveredAt`/`estimatedMinutes` timestamps (not fabricated) |
| **Pickup (Available Orders)** | Multi-outlet real-time discovery across every `businesses/{bid}/outlets/{oid}/orders`, sorted by live GPS distance |
| **New-order ping** | Full-screen 30s countdown, auto-detects newly-appeared in-range orders app-wide, queues multiple pings |
| **Live (Active Trip)** | Real react-leaflet map (OpenStreetMap tiles), 4-step progress, GPS proximity gates (1km/1km/0.3km/outlet radius), slide-to-action (framer-motion drag) |
| **Verification / OTP / Payment** | Item checklist, 4-digit OTP with real rate-limiting (10 attempts/60s block, 60s resend cooldown, admin backup-code override), cash/UPI payment capture |
| **Completion** | Real wallet + ledger + riderStats writes via Firebase transactions, canvas-confetti celebration |
| **Wallet / Earnings** | Real ledger, real unsettled-cash calculation, real weekly chart (recharts) from actual ledger timestamps, settlement history |
| **Profile** | Real photo upload (compressed client-side, Firebase Storage), editable fields, masked Aadhar |
| **Notifications** | Real `riders/{uid}/notifications` listener, FCM push registration |
| **Offline handling** | Firebase `.info/connected` monitor, localStorage action queue for non-GPS-gated actions |
| **Multi-drop routing** | Nearest-neighbor route optimizer shown when a rider has 2+ active orders |

---

## 2. Three real bugs found and fixed during integration

Before trusting this build, I re-verified every Firebase path, field name, and rule
against your **actual live `RiderApp/app.js` (v4.7.1)** and **`database.rules.json`**
— not just the PRD. This caught three real mismatches that would have caused silent
failures in production, all now fixed:

1. **OTP rate-limit path.** I'd initially used a top-level `otpAttempts/{orderId}` path. Your deployed rules only permit this under `businesses/{bid}/outlets/{oid}/otpAttempts/{orderId}` — a top-level write would have been silently denied by the security rules. Fixed to match `resolvePath()`'s exact output in the legacy app.
2. **WhatsApp bot command path.** Same issue — corrected to `businesses/{bid}/outlets/{oid}/botCommands`, matching the rule that explicitly grants riders write access, and the exact `{action, phone, message, timestamp}` payload shape your bot engine already consumes.
3. **`riderAcceptanceRadius` unit bug.** I'd assumed this Firebase field was stored in meters and divided by 1000. Your legacy code reads it directly as **kilometers** (default `1.0`). My original version would have made the "reached drop location" proximity gate almost impossible to satisfy (checking against ~1 meter instead of ~1 km), silently blocking every delivery completion. Fixed.

I also matched the two-field `backupCode` fallback (`settings.Delivery.backupCode` then `settings.Store.deliveryBackupCode`) exactly as the legacy app does.

---

## 3. One thing I could not verify — please smoke-test before relying on it

`database.rules.json`'s `.write` rule on `businesses/{bid}/outlets/{oid}/orders` has no
`$orderId`-level rule beneath it, only a collection-level one. Statically, that makes
the `newData.child('riderId').val() == auth.uid` clause hard to reason about (it's
evaluated against the whole `orders` dictionary, not the single order). Since your
current legacy app writes to the exact same paths with the exact same fields and
already works in production, this build's identical write pattern should behave the
same way — I'm not asking you to change anything. But since I can't hit live Firebase
from this sandbox to confirm empirically, please do one real accept→deliver cycle
against a test order before rolling this out to real riders. If you ever want tighter
rules, here's a drop-in improvement that scopes the rule correctly per order:

```json
"orders": {
  ".read": true,
  ".write": "(!data.exists() && newData.exists()) || (auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true || root.child('admins').child(auth.uid).child('outletId').val() == $oid))",
  "$orderId": {
    ".write": "(!data.exists() && newData.exists()) || (auth != null && (auth.token.superadmin === true || root.child('admins').child(auth.uid).child('isSuper').val() == true || root.child('admins').child(auth.uid).child('outletId').val() == $oid || (root.child('riders').child(auth.uid).exists() && (data.child('riderId').val() == auth.uid || newData.child('riderId').val() == auth.uid))))"
  },
  ".indexOn": ["createdAt", "status", "riderId", "phone", "type", "orderId", "assignedRider"]
}
```
(Also added `assignedRider` to `.indexOn` above — it's queried via `orderByChild('assignedRider')` in both the legacy app and this one, but isn't currently indexed. Harmless today, just a console warning and a minor perf cost at scale — not urgent.)

---

## 4. Second-pass audit — asked to verify, found 10 more real gaps, fixed them

After first delivery, I went back through the PRD's full §7 feature checklist (all 25
subsections) line-by-line against the actual code, rather than taking my own summary
at face value. That surfaced real, meaningful gaps beyond the schema bugs above —
all now fixed and rebuilt (0 TypeScript errors, 0 build warnings):

| # | Gap found | Fix |
|---|---|---|
| 1 | **Every single Firebase listener had no error callback.** A permission-denied or network error would leave every screen stuck on its loading spinner forever, with no way out. `ErrorState.tsx` existed but was never actually used anywhere. | Added `onError` to every `onValue()` call across all services; every hook now exposes `error`/`retry`; Dashboard, Available Orders, Active Trip, Wallet, and Trip History all show a real "Couldn't load — Try Again" screen on failure. |
| 2 | **Offline queue was built but never wired in.** `enqueueOfflineAction()` existed as dead infrastructure — accepting an order, reaching the outlet, or confirming pickup while offline would just hang on the Firebase call. | Wired into all three real action points (accept, reached-outlet, confirm-pickup/reached-drop). Queues locally, and on reconnect **re-fetches fresh GPS and re-runs the same safety-checked service function** rather than blindly replaying a stale location. |
| 3 | **Foreground push notifications did nothing.** `onMessage()` just called `console.log`. | Now writes a real notification record to `riders/{uid}/notifications` and shows a toast immediately, same as background pushes. |
| 4 | **GPS watch never stopped when going Offline** — only the Firebase *sync* paused; the phone's GPS sensor kept running continuously regardless, burning battery all shift. | `watchPosition` itself now starts/stops with the Online toggle. |
| 5 | **Pull-to-refresh didn't exist at all** — only a tap-button. | Built a real touch-gesture pull-to-refresh (rubber-band drag, rotating arrow → spinner past threshold), wrapping all four main tabs. |
| 6 | Sync indicator showed a generic "reconnecting" message with no counts. | Now shows distinct "Offline — N queued" (amber) vs "Syncing N actions..." (blue) states with live counts. |
| 7 | No persistent indicator when location permission is denied — only a one-time toast that could be missed/dismissed. | Added a persistent red banner under the header while Online + permission denied. |
| 8 | Map only ever showed one destination pin, swapping between outlet/customer — never both together; markers used static label tags instead of tappable popups; no "default" map on the Dashboard when idle. | Map now shows rider + both outlet and customer pins simultaneously with real Leaflet `Popup`s ("You are here" / restaurant / customer name); Dashboard shows a live "your location" map whenever Online with no active trip. |
| 9 | `manifest.json` `background_color` was `#0F1720` (the login screen's dark color) instead of the spec'd `#F4F6F8`. | Fixed. |
| 10 | Notification tap always opened a new window/tab instead of focusing an already-open one; "Install App" stayed visible even after the PWA was already installed. | Both fixed. |

**What I checked and did *not* change:** `alert.mp3` looked like it needed adding to the service worker's precache list per spec — but at 2.9KB it falls under Vite's 4KB inline threshold and gets baked directly into the main JS bundle as base64, so there's no separate file to precache. Not a gap, just resolved differently than the PRD assumed for a hand-written app.js.

I'm not going to claim "100% and perfect" a second time without caveats — I found real things the first pass missed, which is exactly why an audit like this is worth doing before go-live. If you want, the next useful pass would be a real device test (not just clean builds) covering: GPS in a moving vehicle, an actual offline→online transition mid-delivery, and a push notification while the app is fully backgrounded.

---

## 5. Local setup

```bash
unzip RiderApp-source.zip -d RiderApp
cd RiderApp
npm install
npm run dev        # http://localhost:5174
```

No `.env` file needed — Firebase config is hardcoded in `src/lib/firebase.ts`,
matching the same convention already used in Marketplace/SupremeAdmin/ShopAdmin.

## 6. Build & deploy

```bash
npm run build       # outputs to RiderApp/dist
```

Your existing `firebase.json` already has a `rider` hosting target — it currently
points at `"public": "RiderApp"` (the old vanilla folder). **Do not just repoint it
and deploy** — follow the safe cutover below first.

### Safe cutover (recommended)

1. Add a **temporary second hosting target** for testing, e.g.:
   ```json
   {
     "target": "rider-v2-staging",
     "public": "RiderApp-v2/dist",
     "rewrites": [{ "source": "**", "destination": "/index.html" }]
   }
   ```
2. `firebase target:apply hosting rider-v2-staging <your-staging-site-id>`
3. `firebase deploy --only hosting:rider-v2-staging`
4. Have 2-3 real riders use the staging URL for a full shift — accept, pickup, OTP, payment, wallet — before touching production.
5. Once confirmed, replace the **existing** `rider` target's `public` path with the new build's `dist/` folder and deploy normally. Existing riders on the old PWA will get the new app on next load (the new `sw.js` uses a versioned cache name and force-clears old caches on activate).

### One thing to add before go-live: FCM VAPID key

Push notifications need a Web Push certificate key. In `src/services/notificationService.ts`,
set `VAPID_KEY` (Firebase Console → Project Settings → Cloud Messaging → Web Push certificates).
Without it, in-app notifications still work fully — only background push is affected.

---

## 7. Known, intentional scope notes

- **Rider rating**: no rating pipeline exists anywhere in the platform yet (confirmed — not in `database.rules.json`, not in the legacy app). The stat card shows "New" until a `riders/{uid}/rating` field exists; I didn't fabricate a number.
- **On-time %**: computed for real from `deliveredAt - acceptedAt` vs `estimatedMinutes` on today's completed orders — shows "—" until the rider has completed at least one delivery today, rather than a fake percentage.
- **Weekly earnings target** (₹5,000, `WEEKLY_EARNINGS_TARGET` in `lib/constants.ts`): a motivational UI target, not a backend value — easy to wire to a real Firebase-configurable setting later if you want per-rider or per-city targets.
- **"Online hours"** on the Earnings page measures the current app session only (no server-side online-duration log exists in the schema) — labeled honestly as "this session," not all-day.

---

## 8. File structure

```
RiderApp/
├── public/                    manifest, sw.js, firebase-messaging-sw.js, icons
├── src/
│   ├── lib/                   firebase.ts, constants.ts (all DB paths), utils.ts
│   ├── types/                 index.ts — every Firebase schema shape
│   ├── services/              orderService, authService, riderService, walletService,
│   │                           locationService, notificationService, storageService,
│   │                           whatsappService, auditService — all real Firebase I/O
│   ├── contexts/               AuthContext, RiderContext, LocationContext
│   ├── hooks/                  useAvailableOrders, useActiveOrder, useOrderHistory,
│   │                           useWallet, useEarnings, useNotifications, useSettlements...
│   ├── components/
│   │   ├── ui/                 hand-built shadcn/ui primitives (button, sheet, dialog...)
│   │   ├── layout/              AppLayout, Header, Sidebar, BottomNav, AuthGuard
│   │   ├── auth/ dashboard/ orders/ active-trip/ modals/ wallet/ earnings/ profile/ notifications/ shared/
│   ├── pages/                  one thin wrapper per route
│   ├── App.tsx                  wouter routing, lazy-loaded per page
│   └── main.tsx
```

---

*Built and verified in one pass — cross-checked against the live `app.js`, `database.rules.json`, and `firebase.json` rather than the PRD alone.*
