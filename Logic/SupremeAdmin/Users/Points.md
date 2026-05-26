# Users — Points

## Key Implementation Details
- Transaction-based wallet update ensures atomicity
- Wallet history uses Firebase push() for auto-generated keys
- CSV export reads from DOM (only current page)
- Global usersData shared with Dashboard for user count

## Fixed Bugs
1. ~~**MEDIUM**: Wallet history modal queries .wallet-history-list (doesn't exist)~~ **FIXED**
   - Now queries tbody#walletHistoryBody and renders table rows

## Gotchas
- CSV export only exports visible (paginated) users, not all users
- Wallet history limited to 5 entries — no "view all" option
- No debit/charge functionality — admin can only add funds
- No wallet balance validation — user wallet can go negative if orders deduct before balance check
- Password reset sends email to user — no in-panel password change
- No user deletion or suspension from this tab
- User's wallet is a number, not a map — can't store metadata per transaction on balance itself
