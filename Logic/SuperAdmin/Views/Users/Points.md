# Users Tab — Important Points

1. **Transaction safety**: `transaction()` on walletBalance prevents race conditions if multiple admins credit simultaneously
2. **No withdrawal functionality**: Wallet modal only credits (no debit) — withdrawals handled elsewhere or not implemented
3. **Password reset email**: Uses `sendPasswordResetEmail()` from primary Firebase Auth instance
4. **Export fields**: Name, Email, Phone, Wallet Balance, Last Active — safeCSV() applied
5. **Pagination**: PAGINATION.users tracks page state independently of other tabs
6. **No real-time updates**: Uses `once('value')` — must refresh to see changes from other sources
7. **User deletion**: Not implemented — users cannot be deleted through this panel
