# Users — Code Logics

## Initialization
- initUsers() attaches real-time listener on /users
- Stores data in global usersData array

## Real-Time Listener
- Listens on /users
- On data change: filters, paginates, renders table
- Also sets global usersData (used by Dashboard for user count)

## Pagination
- renderUsersPage(page): 20 per page
- currentUsersPage tracks page state

## Wallet Credit
- walletModal opens: Amount*, Reason, UserName (readonly), UserEmail (readonly)
- walletSave():
  1. Validates amount > 0
  2. Transaction on /users/{uid}/wallet (atomic increment by amount)
  3. Pushes to /users/{uid}/walletHistory/{key}: {amount, type: "credit", reason, timestamp}
  4. Shows success toast

## Wallet History (BROKEN)
- viewWalletHistory(uid) queries .wallet-history-list
- BUG: HTML has tbody#walletHistoryBody inside a table, not .wallet-history-list
- Renders: date, amount, type, description for last 5 transactions
- Uses limitToLast(5) on walletHistory reference

## Password Reset
- resetUserPassword(email) → auth.sendPasswordResetEmail(email)

## CSV Export
- exportCSV() renders table headers and rows as CSV
- Includes: Name, Email, Phone, Wallet Balance
- Downloads with filename: "users_{date}.csv"

## Search/Filter
- Client-side search by name, email, or phone
- Case-insensitive includes match
