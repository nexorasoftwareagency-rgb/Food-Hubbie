# Available View — Important Points

1. **Distance calculation**: Uses Haversine formula via `window.getDistance()` — returns km with 1 decimal
2. **Accept button state**: Disabled if distance > 1km, rider offline, or GPS unavailable
3. **Transaction safety**: `runTransaction` on the order node prevents double-assignment during concurrent taps
4. **Offline queue**: If navigator.onLine === false, ACCEPT_ORDER saved to localStorage and processed on reconnect
5. **Order removal**: Accepted/skipped orders immediately removed from DOM but listener keeps them out
6. **Audio ping**: Even on available view, new orders play a soft chime (not the full-screen alert)
7. **Empty state**: Shows illustration + "No pickups available right now" message
8. **Search debounce**: 300ms debounce on search input to avoid excessive DOM updates
9. **Ping modal persistence**: If rider is on sec-available, new orders appear in list; if on any other view, they trigger the full-screen ping modal
