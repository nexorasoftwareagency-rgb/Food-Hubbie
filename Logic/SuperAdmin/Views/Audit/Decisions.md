# Audit Tab — Decisions

## Design Decisions
1. **Unified from 4 sources** — Single view for all system events across Admin, Marketplace, Bot, and Rider
2. **Source filter** — Isolate specific system's logs for focused investigation
3. **Paginated display** — Prevents browser freeze with large log volumes
4. **Metadata truncated** — Long action details shown with `text-overflow: ellipsis`
5. **Monospace font** — Console-like appearance for technical audit data
6. **One-time load** — No real-time listener; logs are historical, not live
7. **Source badge coloring** — Visual distinction between systems (color-coded badges)
