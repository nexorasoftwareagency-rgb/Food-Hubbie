## Points.md

- `todayOrd` filter uses `new Date(o.createdAt).toISOString().split("T")[0]` — fragile; created at midnight (IST vs UTC) could shift day
- Revenue chart toggles between today's data and mock WEEK_DATA — "Today" shows real data, "Week" shows mock data (confusing)
- Top items counts across ALL orders (not just today) — shows lifetime popularity, not daily
- Priority orders sorted by status weight only — no time factor; old "Placed" orders show before recent "Ready" orders
- No loading/empty states for individual sections — whole page is either loaded or not
- Rider count only counts "Online" or "On Delivery" — "Offline" riders excluded from active count
