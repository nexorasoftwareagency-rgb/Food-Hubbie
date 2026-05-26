# Users Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `users` | `once('value')` | Load all users |
| `users/{uid}/walletBalance` | Transaction | Wallet credit |
| `users/{uid}/walletHistory/{txId}` | Push | Credit history |

## Rules
```json
{
  "rules": {
    "users": {
      ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business', 'support']",
      "$uid": {
        "walletBalance": {
          ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']",
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "walletHistory": {
          "$txId": {
            ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
          }
        }
      }
    }
  }
}
```

## Notes
- Read: most admin roles can view users
- Wallet write: restricted to superadmin/admin
- Balance validation ensures non-negative
