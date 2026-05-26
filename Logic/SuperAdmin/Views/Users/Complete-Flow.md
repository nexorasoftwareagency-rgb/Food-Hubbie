# Users Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "User Registry" tab
2. loadUsers() called:
   ├─ db.ref('users').once('value', (snap) => {
   │   ├─ Parse allUsers
   │   ├─ PAGINATION.users.total = count
   │   ├─ renderUsers(page 1)
   │   └─ lucide.createIcons()
   │   })
```

## Search Flow
```
1. Admin types in #userSearch
2. filterUsers() on input:
   ├─ Filter allUsers where name/email/phone includes search term
   └─ renderUsers() with filtered list
```

## Wallet Credit Flow
```
1. Admin taps "Wallet" on user row
2. showWalletModal(uid): shows amount + reason form
3. Admin enters amount and reason
4. Taps "Credit"
5. processWalletCredit():
   ├─ Read amount, reason
   ├─ db.ref('users/{uid}/walletBalance').transaction(current => (current||0) + amount)
   ├─ db.ref('users/{uid}/walletHistory').push({ amount, reason, timestamp, adminId })
   ├─ logAdminAction('WALLET_CREDITED', { uid, amount })
   ├─ showToast("Wallet credited")
   └─ Refresh user list
```

## Reset Password Flow
```
1. Admin taps "Reset Password" on user row
2. SweetAlert2 confirm: "Send password reset to {email}?"
3. On confirm:
   ├─ auth.sendPasswordResetEmail(email)
   └─ showToast("Password reset email sent to {email}")
```

## Export Flow
```
1. Admin taps "Export"
2. Build CSV with name, email, phone, wallet, last active
3. safeCSV() on all fields
4. Download: users_export_YYYY-MM-DD.csv
```
