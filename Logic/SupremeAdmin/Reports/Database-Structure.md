# Reports — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders/{orderId} | Read | All orders for metrics |

## Data Shape Accessed
```json
{
  "businesses": {
    "{bid}": {
      "name": "Business Name",
      "outlets": {
        "{oid}": {
          "name": "Outlet Name",
          "orders": {
            "{orderId}": {
              "total": 250,
              "status": "delivered",
              "timestamp": 1717000000000,
              "businessName": "Business Name",
              "outletName": "Outlet Name"
            }
          }
        }
      }
    }
  }
}
```

## Computed Metrics (Client-Side)
| Metric | Formula |
|--------|---------|
| Total Revenue | Sum of all order totals |
| Total Orders | Count of all orders |
| Avg Order Value | Total Revenue / Total Orders |
| Net Platform Revenue | Revenue - commissions - fees |
| Partner Payouts | Sum of commission amounts + fees |
| Take Rate | (Net Platform Revenue / Total Revenue) * 100 |

## Top 10 Outlets
Aggregated by outlet name, sorted by total revenue descending, top 10 shown.
