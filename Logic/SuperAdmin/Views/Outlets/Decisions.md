# Outlets Tab — Decisions

## Design Decisions
1. **Read-only profile modal** — Full analytics view without edit capability; separate edit modal keeps concerns separated
2. **Embedded analytics in profile** — Orders count, revenue, avg value, rating shown per outlet
3. **Admin password editing in outlet modal** — Convenience for resetting outlet admin credentials
4. **Search filter** — Client-side, debounced for large outlet lists
5. **Pagination** — Standard pagination for many outlets (scale to 100+)
6. **Atomic outlet update** — Outlet data + admin password updated in single `update()` call
