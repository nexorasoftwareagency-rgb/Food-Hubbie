# Completed View — Firebase Rules

## Paths Accessed
| Path | Access |
|---|---|
| `riders/{uid}/ledger` | Read — all ledger entries |
| `businesses/{b}/outlets/{o}/orders/{id}` | Read — full order detail (when tapping card) |

## Rules
```json
{
  "rules": {
    "riders": {
      "$uid": {
        "ledger": {
          ".read": "auth.uid === $uid"
        }
      }
    },
    "businesses": {
      "$bid": {
        "outlets": {
          "$oid": {
            "orders": {
              "$orderId": {
                ".read": "auth != null"
              }
            }
          }
        }
      }
    }
  }
}
```

## Security Notes
- Rider can only read own ledger entries
- Order detail reads authorized for all authenticated riders
- No write access on completed view (read-only)
