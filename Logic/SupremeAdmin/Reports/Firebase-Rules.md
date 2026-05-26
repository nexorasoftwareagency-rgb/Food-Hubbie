# Reports — Firebase Rules

## Paths Accessed
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders | Read | Order data for metrics |

## Security Considerations
- Reports reads all orders across all businesses
- No write operations from this tab
- No sensitive data exposure but order totals are visible

## Suggested Rules
```json
{
  "businesses": {
    "$bid": {
      "outlets": {
        "$oid": {
          "orders": {
            ".read": "auth != null",
            ".write": "auth != null"
          }
        }
      }
    }
  }
}
```

## Performance Note
- All orders read every time tab is visited
- No .indexOn for order timestamp (used for date filtering in future)
- No pre-computed analytics node — everything computed client-side
