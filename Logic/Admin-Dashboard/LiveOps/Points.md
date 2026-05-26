# LiveOpsPage Key Points

## Order ID Format
- Manual order creation uses `push()` → auto-generated Firebase key
- Order ID format differs from POS (which uses `set()` with date-based keys)
- Mixed ID formats may appear in the same list

## Rider Activity Card
- Shows **mock data only** — not connected to Firebase riders
- `MOCK_RIDERS` constant with static entries
- Does not reflect real rider status, location, or earnings

## `advance()` Edge Cases
- Uses `SEQ.indexOf(order.status)` to find current position
- Orders with status not in SEQ (e.g., `"Pending"`) return `idx === -1` → function returns early
- No error toast for invalid status — silently fails

## Payment Status
- `advance()` does **not** update `paymentStatus`
- Only OrderPage's `updateStatus()` sets `paymentStatus: "Paid"` on delivery
- Manual orders created via LiveOps never auto-set payment to Paid

## `saveOperation()` for Existing Orders
- Does **not** validate status flow
- Can set any status directly via the edit modal
- Bypasses the normal SEQ progression

## `relTime()` Accuracy
- Uses client `Date.now()` for relative time calculation
- Timestamps will shift if browser clock is incorrect
- Not suitable for precise time tracking
