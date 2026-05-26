# Users — Complete Flow

## User Journey
1. Admin clicks Users tab → initUsers() fires
2. Real-time listener on /users → table renders (paginated 20/page)
3. Admin can:

### Credit Wallet
1. Click "Credit Wallet" → walletModal opens
2. Shows: UserName (readonly), UserEmail (readonly), Amount*, Reason
3. Enter amount (must be > 0) and reason
4. Click Save → walletSave():
   a. Transaction on /users/{uid}/wallet: increment by amount
   b. Push to /users/{uid}/walletHistory: {amount, type: "credit", reason, timestamp}
   c. Success toast
   d. Modal closes, balance updates in table

### View Wallet History
1. Click "Wallet History" → walletHistoryModal opens
2. Renders table rows in tbody#walletHistoryBody
3. Shows last 5 transactions with date, amount, type, description

### Reset Password
1. Click "Reset Password" → sendPasswordResetEmail(userEmail)
2. Firebase sends password reset email
3. Success toast

### Export CSV
1. Click "Export CSV"
2. Reads current table rows (visible page only)
3. Generates CSV with BOM
4. Triggers download
