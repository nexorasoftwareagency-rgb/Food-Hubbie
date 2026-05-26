# Home View — Firebase Rules

## Paths Accessed
| Path | Access |
|---|---|
| `riders/{uid}` | Read — rider profile |
| `riderStats/{riderId}/today` | Read — daily stats |
| `businesses/{b}/outlets/{o}/orders` | Query — current active order |

## Rules
```json
{
  "rules": {
    "riders": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid"
      }
    },
    "riderStats": {
      "$riderId": {
        ".read": "auth.uid === $riderId"
      }
    }
  }
}
```

## Security Notes
- Rider can only read own profile and stats
- No cross-rider data access
- Orders query filtered client-side by `assignedRider === auth.uid`
