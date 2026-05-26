# OrdersPage Key Points

## Status Validation
- `updateStatus` allows jumping to **any** status from the dropdown
- Validation only rejects if the new status is not the immediate next step in SEQ AND not "Cancelled"
- This means an admin could skip statuses via the dropdown — the UI allows it but the handler rejects it

## Date Filter
- Compares ISO date strings (YYYY-MM-DD) against `createdAt`
- Works only if `createdAt` is an ISO string or parseable by `new Date()`
- Firestore timestamps or different formats may break filtering

## Rider Assignment Race Condition
- Order and rider are fetched in **separate** `get()` calls
- No transaction wrapping — two admins assigning simultaneously to the same order could race
- Last write wins; no conflict detection

## `assignedRider` Field
- Uses `rider?.email` as the `assignedRider` value
- Likely should be rider name for display purposes
- LiveOpsPage uses `rider?.email || ""` consistently with empty fallback

## `deliveryFee` Display
- Shown in modal pricing breakdown
- Never set by the POS — only present for orders from external sources (e.g., bot)
- Shows as empty/zero for most orders

## Delete Behavior
- No confirmation toast after successful deletion
- Just "Order deleted" toast shown
- Order is permanently removed — no soft-delete or archive
