# Users — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /users | Read | User data |
| /users/{uid}/wallet | Transaction | Wallet balance |
| /users/{uid}/walletHistory | Write | Transaction history |

## Data Shapes

### User Record
```json
{
  "users": {
    "{uid}": {
      "name": "User Name",
      "email": "user@email.com",
      "phone": "9876543210",
      "wallet": 500,
      "walletHistory": {
        "{key}": {
          "amount": 100,
          "type": "credit",
          "reason": "Admin credit for good service",
          "timestamp": 1717000000000
        }
      }
    }
  }
}
```

### Wallet History Entry
| Field | Type | Description |
|-------|------|-------------|
| amount | Number | Credit amount in ₹ |
| type | String | "credit" (only type used) |
| reason | String | Admin-provided description |
| timestamp | Number | Epoch milliseconds |

## Key Notes
- wallet field is top-level on user (not nested)
- walletHistory uses Firebase push keys
- History is limited to last 5 entries via limitToLast(5)
- No debit or refund transaction types exist
