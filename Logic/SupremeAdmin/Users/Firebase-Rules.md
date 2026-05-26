# Users — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /users | Read (listener) | All user data |
| /users/{uid}/wallet | Write (transaction) | Credit wallet |
| /users/{uid}/walletHistory | Write (push) | Add transaction record |

## Security Considerations
- /users/{uid}/wallet must use transaction for atomicity
- Wallet history push adds entries without validation
- Any authenticated admin can credit any user's wallet
- No debit/withdrawal tracking (credit only from admin panel)

## Suggested Rules
```json
{
  "users": {
    ".read": "auth != null",
    "$uid": {
      "wallet": {
        ".write": "auth != null",
        ".validate": "newData.isNumber() && newData.val() >= 0"
      },
      "walletHistory": {
        ".write": "auth != null"
      }
    }
  }
}
```

## Transaction Requirement
Wallet updates use Firebase transactions:
```js
ref.transaction(current => (current || 0) + amount)
```
This requires .write permission on the wallet path with transaction support enabled.
