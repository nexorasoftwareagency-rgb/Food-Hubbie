# Analytics Tab — Decisions

## Design Decisions
1. **Shares loadReports() with Reports tab** — Avoids duplicate aggregation logic
2. **Read-only KPI display** — No charts or exports; simpler than Reports tab
3. **Refresh button** — Manual data reload since no real-time listener
4. **Minimal UI** — Fewer cards than Dashboard, focused on growth metrics only
