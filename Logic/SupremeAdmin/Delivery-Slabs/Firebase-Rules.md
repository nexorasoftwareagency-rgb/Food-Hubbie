# Delivery Slabs — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /system/settings/delivery/slabs | Read/Write | Delivery slab array |

## Security Considerations
- Entire array replaced on each write (set operation)
- No per-element validation — array items are unvalidated
- Array storage means concurrent writes can conflict

## Suggested Rules
```json
{
  "system": {
    "settings": {
      "delivery": {
        "slabs": {
          ".read": "auth != null",
          ".write": "auth != null",
          ".validate": "newData.isArray()"
        }
      }
    }
  }
}
```

## Data Shape
```json
{
  "slabs": [
    {"minDistance": 0, "maxDistance": 2, "fee": 20},
    {"minDistance": 2, "maxDistance": 5, "fee": 35},
    {"minDistance": 5, "maxDistance": 10, "fee": 50}
  ]
}
```
