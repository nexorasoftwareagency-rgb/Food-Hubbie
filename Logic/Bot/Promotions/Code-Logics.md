# Promotions Module (bot/index.js) — Code Logics

## Overview
Bot-side campaign executor. Receives `SEND_PROMOTION` commands from Admin via Firebase, walks recipient lists with configurable delay, writes per-recipient status back to Firebase. Supports resume-on-startup, kill-switch, quiet hours, and socket health checks.

## Key Functions

### `runPromotionCampaign(sock, cmd)`
Main campaign loop. Resumable from `currentIndex`.
```
for i = startIndex to recipients.length:
  1. Check killSwitch → abort if on
  2. Sleep through quiet hours if active
  3. Check socket health (sock.ws.isClosed, sock.user == null) → pause if dead
  4. Check cryptoErrorCount > 100 → pause if degraded
  5. Acquire concurrency lock (only 1 campaign per outlet)
  6. Skip opted-out JIDs
  7. Skip customers without promotionalConsent
  8. Personalize template ({name}, {phone}, {lastOrderDate}, {storeName}, {couponCode})
  9. Send with retry (2 attempts, 5s gap)
  10. Log result to bot/{outlet}/promotions/logs/{campaignId}/{phone}
  11. Persist progress every 10 sends (currentIndex heartbeat)
  12. 30s pause every 50 sends (human pacing)
  13. sleep(delayMs) between sends (default 2000ms)
```

### `sendPromotionalMessage(sock, jid, text, mediaUrl)`
Bypasses `appendContactInfo` (no admin contact footer). Always appends "_Reply STOP to unsubscribe._" unless message already contains "STOP".

### `personalizeTemplate(tpl, phone, campaignId, couponCode)`
Token replacement:
- `{name}` → `botUsers/{jid}.name` → `customers/{phone}.name` → "Customer"
- `{phone}` → phone number
- `{lastOrderDate}` → `customers/{phone}.lastOrderDate` → "first time"
- `{storeName}` → `settings/Store.storeName`
- `{couponCode}` → generated code (if `generateCoupons=true`)

### STOP/START handler (in `messages.upsert`)
- `STOP | unsubscribe | opt-out` → write `bot/{outlet}/promotions/optout/{jid}`, reply confirmation
- `START` → update `reOptInAt`, reply confirmation

### Resume on startup (in `startBot()`)
After socket connects, scan `bot/{outlet}/promotions/campaigns` for `status="running"`, re-fetch command, resume from `currentIndex`.

### Scheduled job pickup (5-min heartbeat)
Scan `campaigns` where `runAt ≤ now`:
- If `now - runAt ≤ 15min` → execute immediately
- If `now - runAt > 15min` → auto-cancel (missed window)

## Dependencies
- `./firebase.js` — `db`, `getData`
- `./discount-engine.js` — `validateCouponCode` (for coupon generation)
- Baileys socket from `makeWASocket()`
