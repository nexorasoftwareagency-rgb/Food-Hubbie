## Decisions.md

- Dashboard uses both real-time Firebase (orders, riders) and mock data (WEEK_DATA, charts) — partial real-time implementation
- "Today" comparison uses ISO date string matching on `createdAt` field — works if createdAt is ISO date or parseable
- Revenue only counts "Delivered" orders — pending/preparing orders excluded from revenue
- Priority weighting: Placed=6 (highest urgency), Out for Delivery=1 (lowest) — orders earlier in the flow need more attention
- Top customers aggregated by phone number — "Walk-in" grouped together if no phone provided
- StatCards use inline style with grid template — responsive auto-fill layout
