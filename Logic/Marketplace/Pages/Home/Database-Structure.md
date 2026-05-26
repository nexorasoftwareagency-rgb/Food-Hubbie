# Home Page — Database Structure

## Data Fetched on Load

### Outlets (all)
`businesses/{bizId}/outlets/{outletId}/` → mapped to `Outlet[]`

### Cuisines
`system/platformConfig/cuisines` → `{ id, name, image }[]`

### Reviews (global)
`businesses/{bizId}/outlets/{outletId}/reviews/{reviewId}` → aggregated

### Menu Items (all)
`businesses/{bizId}/outlets/{outletId}/dishes/{dishId}` → mapped to `MenuItem[]`

## Used Fields from Outlet
- `name`, `slug`, `logo`, `coverImage`, `cuisine`, `rating`, `ratingCount`
- `deliveryTimeMin`, `deliveryTimeMax`
- `availability`, `location` (for distance sort)
- `isVegOnly`, `featured`, `offers`, `tags`
