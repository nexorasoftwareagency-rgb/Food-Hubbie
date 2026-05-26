# Dashboard Tab — Decisions

## Design Decisions
1. **Real-time listener on businesses** — Dashboard always reflects current state; no manual refresh needed
2. **4 KPI cards** — Snapshot of key ecosystem metrics at a glance
3. **SVG sparklines** — No chart library dependency for simple trends; inline SVG paths
4. **Order heatmap** — Day/hour grid identifies peak order times for operational planning
5. **Business registry on dashboard** — Quick access to all partners without navigating to dedicated tab
6. **Last Sync timestamp** — Shows data freshness; "Just now" for real-time, timestamp if stale
7. **Hero banner** — Welcome message + system status badge for branding
8. **Data aggregated client-side** — All businesses loaded once, computed in memory
