# Dashboard — Firebase Rules

## Paths Accessed
| Path | Access Type | Purpose |
|------|------------|---------|
| /businesses | Read (listener) | All KPI computation, charts, activity feed |
| /businesses/{bid}/outlets/{oid}/orders | Read (nested iteration) | Orders today, revenue today, activity feed |
| /users | Read (via global) | User count |
| /riders | Read (via global) | Rider count |

## Security Rules Required
```json
{
  "rules": {
    "businesses": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "riders": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Performance Considerations
- Dashboard reads the entire /businesses node (all businesses, outlets, orders, menu items, reviews)
- A deeply nested read of this scale can be slow with many businesses
- No server-side filtering or query — all computation is client-side
- No .indexOn rules defined for orders by timestamp (used for "orders today" filter)
