# Available View — Code Logics

## Purpose
Shows unassigned orders ("Pickups") available for rider to accept.

## Key Functions (app.js)
| Function | Trigger | Action |
|---|---|---|
| `window.showAvailableOrders()` | View init | Fetches unassigned orders |
| `window.acceptOrder(orderId, bid, oid)` | Tap Accept | Proximity check + assign |
| `window.skipOrder(orderId)` | Tap Skip | Dismiss order from list |
| `filterOrders(searchTerm)` | Search input | Client-side order filtering |

## Order Card Display
Each available order rendered as card with:
- Customer name, address, items summary
- Outlet name
- Delivery fee / total
- Distance from rider (km)
- Accept / Skip buttons

## Proximity Check Logic
```
getDistance(riderLat, riderLng, outletLat, outletLng)
  → Haversine formula → distance in km
  → IF distance <= 1km → enable Accept
  → ELSE → show "Too far" disabled Accept
```

## Data Flow
```
showAvailableOrders():
  Load all businesses → outlets → orders
  Filter: order.status === "Placed" AND !order.assignedRider
  Sort: closest distance first
  Render each as card with accept/skip
  Start real-time listener for new orders
```

## Edge Cases
- **No available orders** → "No pickups available" empty state
- **Multiple businesses** → Dynamically loads all businesses/outlets
- **Order accepted by another rider** → Remove from list (child_changed fires)
- **GPS unavailable** → Accept button disabled, show "Enable location" prompt
- **Rider already busy** → Hide available view, show active trip
