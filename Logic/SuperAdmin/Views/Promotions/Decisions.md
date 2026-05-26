# Promotions Tab — Decisions

## Design Decisions
1. **Three promotion controls in cards** — Surge, Global Discount, Platform Fee in single row for quick access
2. **Coupon registry** — Full CRUD with toggle, delete, CSV export, and bulk operations
3. **Rate-limited coupon creation** — Prevents abuse/spam from admin panel
4. **In-memory rate limiter** — Session-only; reset on page refresh (acceptable for admin tool)
5. **CSV export with safeCSV()** — Prevents formula injection when opened in Excel
6. **Bulk pause operation** — Quick "Pause All" for emergency/seasonal changes
7. **Surge status indicator** — Live badge shows whether surge is active at a glance
