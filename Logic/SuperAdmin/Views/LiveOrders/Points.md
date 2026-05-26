# Live Orders Tab — Important Points

1. **Full business tree listener**: `on('value')` on `businesses` reads ALL data on every change — expensive for large ecosystems
2. **Tab switch listener cleanup**: `_liveOrdersUnsub` function stored for detaching listener when leaving tab
3. **Kanban drag-and-drop**: Uses HTML5 native DnD API — `ondragstart`, `ondragover`, `ondrop`
4. **Status validation**: Only valid status values written to Firebase (validated client-side + DB rules)
5. **SLA threshold**: Hardcoded at 30 minutes (not configurable)
6. **48-hour window**: Only orders created within last 48 hours are shown
7. **View toggle**: `localStorage.setItem('orderView', view)` — persists across sessions
8. **Overdue styling**: Kanban cards with `overdue` class get red left border
