# Ledger View — Firebase Rules

## Paths Accessed
| Path | Access |
|---|---|
| `riders/{uid}/wallet` | Read |
| `riders/{uid}/ledger` | Read |
| `settlements/{uid}` | Read, Write (create request) |

## Rules
```json
{
  "rules": {
    "riders": {
      "$uid": {
        "wallet": { ".read": "auth.uid === $uid" },
        "ledger": { ".read": "auth.uid === $uid" }
      }
    },
    "settlements": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    }
  }
}
```

## Security Notes
- Full read access on wallet and ledger for own UID
- Settlement creation allowed for own UID
- Wallet balance is system-managed (rider cannot write directly)
