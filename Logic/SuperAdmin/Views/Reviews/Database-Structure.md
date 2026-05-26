# Reviews Tab — Database Structure

## Review
`businesses/{bid}/outlets/{oid}/reviews/{reviewId}`
| Field | Type | Description |
|---|---|---|
| `userId` | string | Customer UID |
| `userName` | string | Customer name |
| `rating` | number | 1-5 |
| `comment` | string | Review text |
| `timestamp` | number | Review timestamp |
| `outletName` | string | Denormalized for display |
| `businessName` | string | Denormalized for display |

## Computed Metrics
| Metric | Formula |
|---|---|
| Platform Avg Rating | `sum of all ratings / count of all reviews` |
| Total Review Count | Count of all review objects |
| Positive % | `(reviews with rating >= 4) / total * 100` |
| Negative % | `(reviews with rating <= 2) / total * 100` |
| Outlet Avg Rating | `sum(outlet.ratings) / count(outlet.reviews)` |
