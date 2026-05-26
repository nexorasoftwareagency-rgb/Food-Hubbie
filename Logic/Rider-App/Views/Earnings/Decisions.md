# Earnings View — Decisions

## Design Decisions
1. **CSS-based bar chart** — No chart library dependency; uses simple div heights and CSS transitions
2. **Today's hero amount** — Large prominent number for immediate gratification
3. **Weekly view default** — Most useful time window for daily riders
4. **Per-shop breakdown** — Riders work from multiple outlets; need to see which outlet generates most income
5. **Cash to settle shown here too** — Repeated from ledger for convenience; keeps financial data together
6. **Period tabs** — Quick switching without page navigation
7. **No real-time** — Earnings are static historical data; manual refresh is sufficient
8. **Single data source (ledger)** — Avoids needing separate earnings tables; computed client-side
