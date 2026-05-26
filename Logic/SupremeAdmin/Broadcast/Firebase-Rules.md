# Broadcast — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /system/broadcasts | Write | Send broadcast |
| /system/broadcasts/{key} | Read | Broadcast history |

## Security Considerations
- Rate limiting is client-side only — no server-side enforcement
- No validation on broadcast content (XSS in title/message possible)
- Broadcasts are stored permanently (no auto-cleanup)

## Suggested Rules
```json
{
  "system": {
    "broadcasts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$key": {
        ".validate": "newData.hasChildren(['title', 'message', 'audience', 'timestamp'])"
      }
    }
  }
}
```

## Rate Limit (Client-Side Only)
```js
// No server-side enforcement — rate limit can be bypassed
const RATE_LIMIT_SECONDS = 5;
const MAX_BROADCASTS_PER_MINUTE = 5;
```
