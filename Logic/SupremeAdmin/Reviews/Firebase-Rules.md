# Reviews — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/reviews | Read | Load reviews |

## Security Considerations
- Reviews are read-only from SupremeAdmin (no writes)
- Reviews contain userId and userName but no PII
- No .indexOn for reviews by timestamp (sorting done client-side)

## Suggested Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "reviews": {
            ".read": "auth != null",
            ".write": "auth != null",
            "$revId": {
              ".validate": "newData.hasChildren(['userId', 'userName', 'rating', 'comment'])"
            }
          }
        }
      }
    }
  }
}
```
