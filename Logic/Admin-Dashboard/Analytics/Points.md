# Points / Gotchas: AnalyticsPage

- **Period selector is cosmetic** — doesn't actually filter or aggregate differently; all periods show same data
- **All data from module-level constants** — `WEEK_DATA`, `CAT_DATA`, etc. — not from Firebase
- **Rider Performance chart** uses `MOCK_RIDERS` earn field — static demo
- **Trend arrows**: up if positive, down if negative — uses `ArrowUp` / `ArrowDown` icons
- **No drill-down** or interactivity beyond what recharts provides
- **Best Day** computed as max rev from `WEEK_DATA` — "Sunday" always wins (₹74,000)
