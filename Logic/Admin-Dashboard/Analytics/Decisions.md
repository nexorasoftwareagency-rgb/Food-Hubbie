# Decisions: AnalyticsPage

## Why live data
Originally the page used mock data (`WEEK_DATA`, `PREV_WEEK_DATA`, `CAT_DATA`, `HOURLY_DATA`, `MOCK_RIDERS`) for chart-library demo purposes. It was rewritten to subscribe to real Firebase nodes because the admin needs actual business insights, not demo numbers.

## Design choices
- **Period selector is real** — week=7d, month=30d, quarter=90d. Date window computed via `Date.now() - days * 86400000`. Previous period uses the same window shifted back by `days`.
- **Revenue only counts delivered orders** — pending / cancelled / in-transit orders are not counted in revenue metrics (would inflate the number). Order *count* still includes all non-cancelled statuses.
- **Day-of-week bucketing** — `aggregateByDay` returns 7 buckets (Sun–Sat) regardless of period. This makes "Best Day" (day of week) meaningful; if we bucketed by date, a 7-day window could have empty days.
- **Cancellation rate uses case-insensitive status match** — handles `"cancelled"` and `"canceled"` (UK vs US).
- **Top Customers uses delivered revenue only** — pending cancellations shouldn't rank a customer high.
- **No drill-down** — recharts tooltip only. Future: click bar → orders list filtered to that day.
- **Dual-axis bar chart** — revenue (left, ₹k) and order count (right, raw int) need different scales; recharts `yAxisId` solves this.

## Trade-offs
- **Recharts is heavy** — adds ~150KB to bundle. Acceptable for an admin dashboard; not a customer-facing concern.
- **No date-range picker** — only 3 preset periods (week/month/quarter). Custom range would require a date-picker lib.
- **No comparison overlay** — only one bar for "previous period" sum, not a side-by-side per-day overlay. Could add later by changing aggregator to return both `rev` and `prevRev` per day-bucket (already does — UI just doesn't render it).
- **No CSV export of customers/dishes** — only daily aggregates export to CSV. Could add later.

## Future
- Date-range picker (react-day-picker)
- Compare-to-previous overlay on bar chart
- Per-dish drill-down → orders
- Customer cohort retention
