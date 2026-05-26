# Home View — Database Structure

## Rider Profile (read on dashboard)
`riders/{uid}`
- `name`, `phone`, `photoURL`, `status`, `isActive`
- `wallet/balance`, `wallet/totalEarned`

## Today's Stats (computed)
`riderStats/{riderId}/today`
| Field | Type | Description |
|---|---|---|
| `deliveredCount` | number | Orders delivered today |
| `onTimeCount` | number | Delivered on-time |
| `onTimePercent` | number | Percentage |
| `earnings` | number | Today's earnings |
| `totalRating` | number | Sum of ratings |
| `ratingCount` | number | Number of ratings |

## Current Order (real-time)
Queried from `businesses/{b}/outlets/{o}/orders/{id}`
- Filtered by `assignedRider === uid` and `status !== "Delivered"`
