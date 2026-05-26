# Reviews — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/reviews/{revId} | Read | Review data |

## Data Shape
```json
{
  "businesses": {
    "{bid}": {
      "outlets": {
        "{oid}": {
          "reviews": {
            "{revId}": {
              "userId": "user_uid_123",
              "userName": "John Doe",
              "rating": 4,
              "comment": "Great food and fast delivery! Really enjoyed the butter chicken.",
              "timestamp": 1717000000000
            }
          }
        }
      }
    }
  }
}
```

## Review Fields
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Firebase Auth UID of reviewer |
| userName | String | Display name of reviewer |
| rating | Number | Rating out of 5 (integer) |
| comment | String | Review text (truncated to 100 chars in display) |
| timestamp | Number | Epoch milliseconds of submission |

## Key Notes
- No reply/response field for businesses
- No admin moderation fields (approved, flagged, etc.)
- No review update or delete functionality
- Reviews are uniquely identified by push keys under each outlet
