# Users Tab — Code Logics

## Purpose
Platform-wide customer registry — view user details, manage wallet credits, reset passwords, export data.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadUsers()` | Tab load | Load all users from Firebase |
| `filterUsers()` | Search input | Client-side filter by name/email/phone |
| `renderUsers()` | Data ready | Paginated user table |
| `showWalletModal(uid)` | Wallet button | Open wallet credit modal |
| `processWalletCredit()` | Credit button | Atomic wallet credit with transaction |
| `exportUsers()` | Export button | CSV export |
| `triggerPasswordReset(email)` | Reset button | Firebase password reset email |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `users` | `once('value')` | All users |
| `users/{uid}/walletBalance` | Transaction | Wallet credit |
| `users/{uid}/walletHistory/{txId}` | Push | Credit history |

## User Table Columns
| Column | Source |
|---|---|
| User Identity | `user.name` |
| Contact Info | `user.email`, `user.phone` |
| Wallet Balance | `user.walletBalance` (formatted) |
| Last Active | `user.lastSeen` or `user.createdAt` |
| Operations | Wallet / Reset Password buttons |

## Wallet Credit
```
showWalletModal(uid):
  ├─ Store target uid
  └─ Show modal with amount + reason fields

processWalletCredit():
  ├─ Read amount + reason
  ├─ Transaction on users/{uid}/walletBalance
  ├─ Push to users/{uid}/walletHistory/{txId}
  ├─ logAdminAction('WALLET_CREDITED', { uid, amount })
  └─ showToast("Wallet credited")
```

## Password Reset
```
triggerPasswordReset(email):
  ├─ SweetAlert2 confirm
  ├─ auth.sendPasswordResetEmail(email)
  └─ showToast("Password reset email sent")
```

## Edge Cases
- **No users** → "No users registered" empty state
- **User with no wallet** → Transaction creates wallet if not existing (null coalescing)
- **Negative credit amount** → HTML5 `min="0"` prevents negative
- **Password reset email bounces** → Firebase Auth handles (no feedback to admin)
- **Search no results** → "No users match your search"
