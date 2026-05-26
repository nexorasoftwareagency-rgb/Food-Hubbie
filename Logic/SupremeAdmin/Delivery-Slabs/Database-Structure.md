# Delivery Slabs — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /system/settings/delivery/slabs | Read/Write | Delivery fee slabs |

## Data Shape (Array)
```json
{
  "system": {
    "settings": {
      "delivery": {
        "slabs": [
          {"minDistance": 0, "maxDistance": 2, "fee": 20},
          {"minDistance": 2, "maxDistance": 5, "fee": 35},
          {"minDistance": 5, "maxDistance": 10, "fee": 50},
          {"minDistance": 10, "maxDistance": 20, "fee": 80},
          {"minDistance": 20, "maxDistance": 50, "fee": 150}
        ]
      }
    }
  }
}
```

## Slab Fields
| Field | Type | Description |
|-------|------|-------------|
| minDistance | Number | Minimum distance in km (inclusive) |
| maxDistance | Number | Maximum distance in km (exclusive) |
| fee | Number | Delivery fee in ₹ |

## Key Notes
- Stored as array (not object) — unusual for Firebase RTDB
- Array order determines evaluation priority
- No unique keys per slab — elements identified by array index
- No gaps are enforced between slabs (overlapping ranges possible)
