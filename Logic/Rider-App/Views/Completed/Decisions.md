# Completed View — Decisions

## Design Decisions
1. **Ledger-based history** — Uses rider's ledger entries (not order queries) for reliable history even if orders deleted
2. **Client-side search** — All data loaded once, filtered client-side; avoids additional Firebase queries
3. **Paginated load** — 50 entries per batch to avoid large DOM rendering
4. **Date filter** — Today/Week/Month/All tabs for quick period filtering
5. **Order detail modal** — Tapping card shows full order breakdown (items, amounts, timeline) in overlay
6. **Debounced search** — 300ms delay prevents re-render on every keystroke
7. **No real-time updates** — Static snapshot on view load; pull-to-refresh for new data
