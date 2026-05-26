# Bot Status Monitor (status-monitor.js) — Points

## Edge Cases
- **Order older than 10 min on startup** — skipped silently; no notification for orders placed while bot was offline
- **No customer JID** (`order.whatsappNumber` + `order.phone` both missing) — returns early; no customer notification
- **No admin reportPhone** — admin not notified of new orders via WhatsApp; FCM still fires if configured
- **No online riders** — broadcast silently skipped
- **Rider phone missing but riderId present** — rider assignment notified via in-app only (WhatsApp skipped)
- **Image URL fails** — `sendMessage` with image throws → caught and logged; customer gets no notification at all (no text fallback!)

## Gotchas
- `processedStatus` is **in-memory only** — lost on bot restart; all current orders may re-notify if within 10-min window
- Rider broadcast fires for **Cooked, Ready, AND Packed** — may spam online riders if order lingers in one status
- No dedup for rider broadcast — same rider gets notified on each status transition if still unassigned
- OTP generation is expected from Admin Dashboard — status-monitor only reads/uses existing OTP

## Future Improvements
- Persist `processedStatus` to Firebase for crash resilience
- Add "already notified this rider" check to prevent broadcast spam
- Add text-only fallback when image send fails
- Add configurable notification quiet hours
- Support localization for notification messages
