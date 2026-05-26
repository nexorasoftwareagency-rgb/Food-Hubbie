# Dashboard — Database Structure

## Paths Used
| Path | Read/Write | Purpose |
|------|-----------|---------|
| /businesses | Read | KPI computation (count businesses, outlets, orders, revenue) |
| /users | Read (via global) | User count |
| /riders | Read (via global) | Rider count |

## Data Shape Accessed
```json
{
  "businesses": {
    "{bid}": {
      "outlets": {
        "{oid}": {
          "orders": {
            "{orderId}": {
              "total": 200,
              "status": "delivered",
              "timestamp": 1717000000000,
              "customerName": "Customer"
            }
          }
        }
      }
    }
  }
}
```

## Computed Metrics
- Businesses Count: Object.keys(businesses).length
- Outlets Count: Sum of Object.keys(biz.outlets || {}).length across all businesses
- Orders Today: Orders where timestamp > (now - 86400000)
- Revenue Today: Sum of order.total for today's orders
- Users Count: Object.keys(usersData).length
- Riders Count: Object.keys(ridersData).length
