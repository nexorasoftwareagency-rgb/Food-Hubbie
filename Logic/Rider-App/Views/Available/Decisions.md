# Available View — Decisions

## Design Decisions
1. **Real-time list** — Uses Firebase `onChildAdded/onChildChanged` for live updates, no polling
2. **Distance sort** — Nearest orders first to minimize rider travel time
3. **1km proximity gate** — Prevents riders from accepting orders too far away, ensures reasonable pickup time
4. **Accept via transaction** — `runTransaction` prevents race conditions when multiple riders tap simultaneously
5. **Skip action** — Temporarily hides order from list (session only, not persisted to Firebase)
6. **Search/filter** — Client-side filtering by customer name or order ID for quick lookup
7. **Ping modal** — When rider is on another view, new orders trigger full-screen ping with 30s timer instead
