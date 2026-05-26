# Inventory Tab — Decisions

## Design Decisions
1. **Cross-ecosystem inventory scan** — Single view for stock across ALL outlets (not per-outlet)
2. **KPI cards for stock health** — At-a-glance: low stock, active items, out-of-stock counts
3. **Quick stock adjustments** — +/- buttons for rapid bulk updates without opening modals
4. **Search filter** — Client-side filtering by dish name or outlet name
5. **Auto-toggle on stock = 0** — Prevents orders for out-of-stock items without manual action
6. **Last updated tracking** — `lastStockUpdate` tracked for audit trail
7. **Emergency Freeze button** — Quick action to disable all dishes across the platform (e.g., for system maintenance)
