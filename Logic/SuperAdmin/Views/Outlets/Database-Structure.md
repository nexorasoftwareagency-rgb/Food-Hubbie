# Outlets Tab — Database Structure

## Outlet
`businesses/{bid}/outlets/{oid}`
| Field | Type | Description |
|---|---|---|
| `name` | string | Outlet name |
| `id` | string | Outlet ID |
| `slug` | string | URL slug |
| `address` | string | Full address |
| `lat` | number | Latitude |
| `lng` | number | Longitude |
| `email` | string | Admin email |
| `phone` | string | Contact phone |
| `password` | string | Admin password (plaintext) |
| `isActive` | boolean | Status |
| `registeredAt` | number | Created timestamp |

## Order (for analytics)
`businesses/{bid}/outlets/{oid}/orders/{orderId}`
Used fields: `totalAmount`, `status`, `createdAt`

## Review (for rating)
`businesses/{bid}/outlets/{oid}/reviews/{reviewId}`
Used fields: `rating`, `comment`, `timestamp`

## Computed Analytics (client-side)
| Metric | Formula |
|---|---|
| Total Orders | Count of all orders |
| Total Revenue | Sum of totalAmount |
| Avg Order Value | Total Revenue / Total Orders |
| Avg Rating | Sum of ratings / count of reviews |
