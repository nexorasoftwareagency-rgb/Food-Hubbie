# Points / Gotchas: Admin Promotions Module

## Critical
- **Bot must be online** — green/red status dot in header. Start button disabled when offline.
- **One campaign at a time** — concurrency lock prevents parallel sends on same socket.
- **Kill-switch is global** — affects all campaigns for the outlet.

## Performance
- **`onValue` for live progress** — detach on tab switch. 50K Spark reads/day limit.
- **Recipient list in memory** — up to 500 phones stored in `_recipientsCache`. No Firebase read per-recipient.

## WhatsApp Safety
- **2s default delay** — configurable per campaign
- **30s pause every 50 sends** — human-like pacing
- **Quiet hours 10:00–21:00 IST** — configurable per campaign
- **STOP opt-out** — auto-skips future sends
- **promotionalConsent** — required; set on first order

## Edge Cases
- **CSV with no phone column** — falls back to first column with most 10-digit values
- **Duplicate numbers** — pre-flight Set dedup
- **Bot restart mid-campaign** — bot resumes from `currentIndex` on next `startBot()`
- **Missed scheduled window** — auto-cancel if `runAt < now - 15min`
- **Image too large** — client-side preview, no server-side size check yet

## Related docs
- `Logic/Bot/Promotions/Points.md` — bot-side gotchas
- `Logic/Admin-Dashboard/Promotions/Code-Logics.md` — full implementation
