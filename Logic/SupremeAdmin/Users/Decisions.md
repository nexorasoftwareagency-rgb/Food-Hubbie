# Users — Decisions

1. **Real-time listener on /users**: Entire users node downloaded on every change. Scalability concern for large user bases.

2. **Wallet credit only (no debit)**: The wallet credit modal only supports adding funds (credit). No option to deduct or charge users. Debit would need negative amount entry.

3. **Transaction-based wallet update**: Uses Firebase transaction for atomic wallet increment. Prevents race conditions when multiple admins credit simultaneously.

4. **Wallet history stored as sub-collection**: walletHistory is a nested path under each user. Pushes new entries with auto-generated keys.

5. **CSV export from DOM**: Reads rendered table HTML rather than raw data. Limits export to visible page (not all users).

6. **Only last 5 wallet history entries shown**: limitToLast(5) limits history view. No option to see full history or paginate.

7. **Password reset via Firebase email**: Uses built-in sendPasswordResetEmail. Simple but no custom reset flow or password change from admin panel.
