# Broadcast — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /system/broadcasts/{key} | Read/Write | Broadcast records |

## Data Shape
```json
{
  "system": {
    "broadcasts": {
      "-Nabcdef123456": {
        "title": "Weekend Sale!",
        "message": "Get 20% off on all orders this weekend. Use code WEEKEND20.",
        "audience": "all",
        "timestamp": 1717000000000
      }
    }
  }
}
```

## Broadcast Fields
| Field | Type | Description |
|-------|------|-------------|
| title | String | Broadcast title/headline |
| message | String | Broadcast body content |
| audience | String | Target audience: "all", "customers", "partners", "riders" |
| timestamp | Number | Epoch milliseconds of send time |

## Key Notes
- Keys are Firebase push keys (chronologically sortable)
- History queried with orderByChild("timestamp") and limitToLast(50)
- No sent/delivered/read metrics stored
- No status field (e.g., pending/sent/failed)
