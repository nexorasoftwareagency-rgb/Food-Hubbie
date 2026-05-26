# Settlements — Points

## Key Implementation Details
- Commission uses business-level config (not stored per order)
- Net amount = order total - commission (percent) - fixed fee
- Each settlement creates audit log entry
- Settlements are immutable once written (no undo)

## Known Issues
- btnFilterSettlements has no click handler (filtering via change events only)
- No bulk settle — each order settled individually
- No total/summary row showing aggregate settlement amounts
- Settlement date range uses client-side comparison (no server-side query)

## Gotchas
- Commission recalculated at settlement time — if business commission changes between order and settlement, the settlement uses current commission rate, not the rate at order time
- Settlement net amount computed client-side — potential for manipulation
- No verification that order hasn't already been settled (check is client-side only)
- No re-settlement or adjustment flow
- Settlement records are never archived/cleaned by default
