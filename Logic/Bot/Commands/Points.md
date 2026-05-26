# Bot Commands (commands.js) — Points

## Edge Cases
- **No `reportPhone` configured** — report silently skipped (logged as warning)
- **No orders for targetDate** — sends "No orders found" message instead of failing
- **Invalid `targetDate` string** — used directly as-is; no validation; may match zero orders
- **`phone` missing for SEND_GENERIC_MESSAGE** — silently skipped (logged)
- **Bot offline when command written** — command persists; processed immediately when bot reconnects (child_added fires)

## Gotchas
- Command node removal happens **before** bot restart detection — if bot crashes mid-processing, command is already deleted (lost)
- IST conversion added 5h30m to UTC but `new Date(raw).toISOString()` may behave unexpectedly if `raw` is already an ISO string
- Daily report counts all statuses except "Cancelled" — includes "Placed" orders that may never be fulfilled
- No authentication on `botCommands` — any admin with Firebase write access can trigger messages

## Future Improvements
- Add transactional processing (mark as "processing" before removing)
- Add more command types: broadcast to all customers, send menu image, update bot settings
- Add rate limiting on command execution
- Validate `phone` format before sending
