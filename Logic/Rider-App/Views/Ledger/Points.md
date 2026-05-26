# Ledger View — Important Points

1. **Balance = totalEarned - settled** — System tracks balance separately from cash held
2. **Cash to settle calculation**: Sum of `cashCollected` from completed COD deliveries minus already-settled amounts
3. **Today's earning**: Computed client-side from ledger entries where `timestamp` is today (IST)
4. **Settlement request**: Creates entry at `settlements/{uid}/{pushId}` with status "pending"; admin approves from dashboard
5. **Currency format**: All amounts through `window.formatCurrency()` with ₹ prefix and comma separators
6. **Transaction type icons**: 🛵 delivery (green), 💰 settlement (blue), ⚠️ adjustment (yellow)
7. **No negative balance**: Firebase validation prevents wallet from going below 0
8. **Settlement modal**: Shows history with status badges — pending (yellow), approved (green), rejected (red)
9. **Pull-to-refresh**: Re-fetches wallet + ledger data
10. **Read-heavy, write-light**: Only settlement requests are write operations in this view
