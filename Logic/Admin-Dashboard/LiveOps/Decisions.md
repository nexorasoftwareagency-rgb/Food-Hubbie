# LiveOpsPage Decisions

## Separate View from Orders
- Dedicated "Live Ops" view focused on real-time order progression
- Not designed for history search or deep order management
- Optimized for operational dashboard use

## Large Action Buttons
- Next-status labels shown as large pills (e.g., "Accept", "Prep", "Cook")
- Designed for quick tapping in a busy kitchen/delivery environment
- Color-coded for visual scanning

## Progress Dots
- `SEQ.map()` renders dots for each status step
- Filled dots show completed steps, empty for remaining
- Quick visual of order journey progress

## Manual Order Creation
- `push(Outlet("orders"))` allows recording phone/delivery orders
- Useful for orders not made through the POS
- New orders get auto-status `"Placed"`

## `advancing` Set
- Tracks which orders have pending updates
- `setAdvancing(prev => new Set(prev).add(id))` — blocks double-click
- Prevents rapid-fire advance button spam

## Rider Activity Mock Data
- Uses `MOCK_RIDERS` constant (not Firebase riders)
- Static display — needs real data integration for production use
- Shows name, status, vehicle, deliveries count
