# Completed View — Code Logics

## Purpose
Trip history showing rider's past deliveries with search functionality.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `window.showCompletedDeliveries()` | View init | Fetch and render past deliveries |
| `window.searchCompletedOrders(term)` | Search input | Filter delivered orders by ID/name |
| `window.viewCompletedOrderDetail(orderId)` | Tap on card | Show full order details modal |
| `window.filterByDate(range)` | Date filter | Filter by today/week/month/all |

## Data Sources
- **Primary**: Rider's own ledgers — `riders/{uid}/ledger` (has orderId, outletName, customerName)
- **Secondary**: Order snapshot from `businesses/{b}/outlets/{o}/orders/{id}` for full details

## Rendering
```
Each completed order card shows:
  ├─ Order ID (formatted)
  ├─ Customer name
  ├─ Date/time
  ├─ Outlet name
  ├─ Status badge (always "Delivered")
  ├─ Earnings amount
  └─ Tap → view order detail modal
```

## Search
- Client-side filter on customer name or order ID
- 300ms debounce on input
- "No results" empty state if no match

## Edge Cases
- **No history** → "No completed deliveries yet" empty state with illustration
- **Large history** → Paginated load (last 50, then "Load More" button)
- **Deleted order** → Ledger entry still shows but order detail unavailable — show "Order data unavailable"
- **Search no results** → "No deliveries match your search" message
