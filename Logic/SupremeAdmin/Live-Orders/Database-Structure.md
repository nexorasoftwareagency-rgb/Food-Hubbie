# Live Orders — Database Structure

## Paths Used
| Path | Access | Purpose |
|------|--------|---------|
| /businesses/{bid}/outlets/{oid}/orders/{orderId} | Read | Order data |
| /businesses/{bid}/outlets/{oid}/orders/{orderId}/status | Write | Status update |

## Data Shape
```json
{
  "businesses": {
    "biz_1717000000000": {
      "outlets": {
        "outlet_1717000000000": {
          "orders": {
            "FH-1717000000000-ABC": {
              "orderId": "FH-1717000000000-ABC",
              "customerName": "Customer Name",
              "customerPhone": "9876543210",
              "businessName": "Business Name",
              "outletName": "Outlet Name",
              "items": [
                {"name": "Item 1", "qty": 2, "price": 100},
                {"name": "Item 2", "qty": 1, "price": 50}
              ],
              "total": 250,
              "status": "pending",
              "timestamp": 1717000000000,
              "type": "delivery",
              "address": "Delivery Address"
            }
          }
        }
      }
    }
  }
}
```

## Order Status Values
- pending
- confirmed
- preparing
- out_for_delivery
- delivered
- cancelled
- rejected

## Kanban Column Mapping
Each status maps to a Kanban column. Orders distributed by current status value.
