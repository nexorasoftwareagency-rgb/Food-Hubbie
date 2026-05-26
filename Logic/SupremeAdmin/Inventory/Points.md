# Inventory — Points

## Key Implementation Details
- Uses once('value') — no real-time updates
- Stock uses Firebase transaction for atomicity
- Stock floor is 0 (negative not allowed)
- Availability is simple boolean toggle

## Known Issues
- No real-time updates (requires page refresh)
- No add/delete dish functionality
- No bulk stock update
- No stock threshold/low-stock warnings
- No edit dish details (price, name, category)
- Search is client-side only

## Gotchas
- Transaction on stock ensures no race conditions but may fail under heavy concurrent load
- Stock adjustments log no audit trail (unlike settlements)
- Stock decrement does not validate against pending orders
- No image management from this tab
- Category filter would be useful but isn't implemented
- Menu items shown across ALL businesses — no per-business view filter
