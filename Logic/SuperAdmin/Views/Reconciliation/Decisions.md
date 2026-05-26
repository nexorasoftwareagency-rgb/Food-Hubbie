# Reconciliation Tab — Decisions

## Design Decisions
1. **Aggregated across all outlets** — Single view for all financial data across the entire ecosystem
2. **Date range filter** — Enables period-specific reconciliation (daily/weekly/monthly)
3. **Global KPI cards** — At-a-glance totals: volume, commissions, pending, settled
4. **Transaction-based settlement** — `transaction()` ensures atomicity for wallet updates
5. **SweetAlert2 confirm dialog** — Prevents accidental settlements with clear amount/partner display
6. **CSV export** — Offline record-keeping and accounting integration
7. **PENDING as default filter** — Admin typically processes pending settlements, not viewing history
8. **Denormalized outlet/business names** — Loaded once and cached for filter dropdown population
