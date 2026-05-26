# Reconciliation Tab — Important Points

1. **Commission calculation**: Not computed by SuperAdmin — settlements are pre-created with commission already calculated
2. **Transaction safety**: `transaction()` on wallet prevents race conditions during concurrent settlements
3. **CSV safeCSV()**: All numeric fields prefixed with `'` to prevent Excel formula injection
4. **Date filter uses JS Date**: `new Date(fromStr).getTime()` — timezone-dependent, may shift by UTC offset
5. **Outlet filter dropdown**: Populated dynamically from loaded businesses/outlets
6. **Wallet mutation**: Settlement decrements wallet balance (negative amount ledger entry)
7. **Denormalized names**: `outletName` and `businessName` stored on settlement for display without joins
8. **SweetAlert2 pre-confirm**: Shows order details, amounts, and net payout before finalizing
