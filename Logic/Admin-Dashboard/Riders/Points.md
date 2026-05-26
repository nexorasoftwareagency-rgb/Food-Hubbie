# Points / Gotchas: RidersPage

- **No Firebase integration** — real rider data should come from `riders/` node
- **Toggle status doesn't persist** — resets on page refresh
- **Rider chart data hardcoded per rider ID** — not data-driven, each rider has a static entry in `RIDER_CHART`
- **Filter/search state managed but not implemented** — UI exists but no actual filtering logic in mock version
- **No rider registration/edit** — read-only view of mock data
- **KPIs computed**: Online count, On Delivery count, Completion Rate `=(completed/totalOrders)*100`, Avg Rating
