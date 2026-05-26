# Analytics Tab — Important Points

1. **Shares implementation with Reports tab**: Both call `loadReports()` — analytics shows a subset of the data
2. **One-time load**: Uses `once('value')` — data is stale until manual refresh
3. **No real-time listener**: Unlike Dashboard, this tab does not auto-update
4. **Performance**: Full ecosystem aggregation could be slow with large data volumes
5. **Period comparison**: Growth % based on hardcoded period (30 days) — not configurable
