# Earnings View — Firebase Rules

## Paths Accessed
| Path | Access |
|---|---|
| `riders/{uid}/ledger` | Read — all ledger entries |
| `riders/{uid}/wallet` | Read — wallet summary |

## Rules
```json
{
  "rules": {
    "riders": {
      "$uid": {
        "ledger": { ".read": "auth.uid === $uid" },
        "wallet": { ".read": "auth.uid === $uid" }
      }
    }
  }
}
```

## Security Notes
- Identical to Ledger's rules (both read from same paths)
- No write operations in this view
- Rider can only access own data
