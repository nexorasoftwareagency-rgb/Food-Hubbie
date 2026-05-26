# LiveOpsPage Database Structure

Same structure as Orders page — operates on the same Firebase nodes.

## Orders Node
```
businesses/{b}/outlets/{o}/orders/{orderId}/
```

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | Order identifier |
| `customerName` | string | Customer full name |
| `phone` | string | Customer phone number |
| `cart[]` | array | Array of cart items |
| `subtotal` | number | Pre-discount subtotal |
| `discount` | number | Discount amount |
| `tax` | number | Tax amount |
| `total` | number | Order total |
| `status` | string | Current SEQ status |
| `type` | string | Order type |
| `paymentMethod` | string | Payment method |
| `paymentStatus` | string | Payment status |
| `riderId` | string | Assigned rider ID |
| `assignedRider` | string | Rider email |
| `riderName` | string | Rider display name |
| `riderPhone` | string | Rider phone number |
| `assignedAt` | timestamp | When rider was assigned |
| `address` | string | Delivery address |
| `lat` | number | Delivery latitude |
| `lng` | number | Delivery longitude |
| `notes` | string | Order notes |
| `outletAddress` | string | Outlet address |
| `outlet` | string | Outlet name |
| `createdAt` | timestamp | Order creation time |
| `updatedAt` | timestamp | Last update time |

## Riders Node
```
riders/{riderId}/
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Rider name |
| `phone` | string | Rider phone |
| `email` | string | Rider email |
| `vehicle` | string | Vehicle type |
| `status` | string | Online/Offline/On Delivery |
| `location.lat` | number | Current latitude |
| `location.lng` | number | Current longitude |
| `earnings` | number | Total earnings |
| `deliveries` | number | Delivery count |
| `rating` | number | Average rating |
| `zone` | string | Service zone |
| `joinedAt` | timestamp | Join date |
