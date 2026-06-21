# Points / Gotchas: Bot Promotions Module

## Critical
- **Bot restart loses in-memory state** — campaigns must be resumable from RTDB. `startBot()` scans `status="running"` campaigns and resumes from `currentIndex`.
- **`appendContactInfo` footer** — promotional messages MUST bypass this (use `sendPromotionalMessage()`). Otherwise every promo ends with "If you have any Doubt Contact Admin".
- **Single-outlet per process** — one running campaign per outlet, not per process. Two outlets = two bot processes = two independent campaigns.

## WhatsApp Safety
- **2s default delay** — faster sending triggers spam detection
- **30s pause every 50 sends** — human-like pacing
- **Quiet hours 10:00–21:00 IST** — messages outside this window risk bans
- **STOP opt-out** — must be honored; re-opt-in via START
- **Per-send socket health** — `sock.ws.isClosed` check before every send
- **Crypto-error threshold 100** — session degrading, pause campaign

## Concurrency
- **Lock node** — `bot/{outlet}/promotions/lock` prevents parallel campaigns
- **Only one active campaign** per outlet at a time
- **UI disables Start button** while campaign is running

## Performance
- **Live progress uses `onValue`** — detach on tab switch to stay under 50K Spark reads/day
- **Campaign heartbeat** — `currentIndex` persisted every 10 sends
- **30-day log expiry** — in the 5-min heartbeat

## Edge Cases
- **Missed scheduled window** — if `runAt < now - 15min`, auto-cancel
- **Bot offline during campaign** — campaign pauses, resumes on next `startBot()`
- **Duplicate numbers** — pre-flight Set dedup in Admin UI + skip already-sent JIDs
- **CSV column detection** — `PHONE_HINTS` regex matches common column names
- **Image attachment** — optional, uses existing `sendImage()` helper

## Related docs
- `Logic/Bot/Promotions/Code-Logics.md` — full implementation
- `Logic/Admin-Dashboard/Promotions/Points.md` — Admin-side gotchas
