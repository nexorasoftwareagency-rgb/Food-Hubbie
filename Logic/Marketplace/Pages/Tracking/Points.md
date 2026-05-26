# Tracking Page — Points

## Edge Cases
- **Order not found** → `getOrderById(orderId)` returns undefined; page renders empty/fallback
- **Cancelled order** → pipeline renders up to cancelled with red styling; no auto-advance
- **Delivered order** → pipeline complete; review prompt shown; no auto-advance
- **No rider assigned** → rider info card hidden
- **Not authenticated** → cannot view tracking for Firebase orders (requires localStorage cache)

## Gotchas
- ETA is hardcoded (35 min) — never updates based on actual preparation/delivery time
- Demo auto-advance (6s interval) is commented as DISABLED IN PRODUCTION but code remains
- `statusIndex()` returns -1 for unknown statuses — pipeline breaks
- No real-time Firebase listener on the order — status updates only when OrderContext re-fetches

## Future Improvements
- Add real-time Firebase `onValue` listener for live order updates
- Integrate Google Maps for rider location
- Show actual ETA based on order prep time + rider distance
- Add "Contact Rider" call button
- Add "Reorder" button for completed orders
