# Inventory Tab — Important Points

1. **Full scan on load**: `loadInventory()` reads the entire `businesses` tree — expensive with large datasets
2. **No real-time updates**: Uses `once('value')` — manual "Refresh Stock" required to see changes
3. **Stock auto-freeze**: `Math.max(0, current + delta)` prevents negative stock but allows zero
4. **ToggleAvailability**: Sets `isAvailable` to opposite of current value — bypasses stock level
5. **Emergency Freeze**: Intended for bulk `isAvailable = false` across all dishes (not implemented in current code)
6. **Lag on large datasets**: Full business tree scan + client-side aggregation could be slow
7. **No pagination**: All inventory items rendered in single table (could be thousands)
