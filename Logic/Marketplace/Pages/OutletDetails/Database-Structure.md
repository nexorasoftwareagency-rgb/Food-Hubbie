# OutletDetails Page — Database Structure

## Slug Resolution
`slugs/outlets/{slug}` → `{ businessId: string, outletId: string }`

## Outlet
`businesses/{bizId}/outlets/{outletId}` → full outlet object

## Dishes
`businesses/{bizId}/outlets/{outletId}/dishes/{dishId}` → `MenuItem` fields:
- name, description, image, category, price
- sizes[], addons[], crusts[]
- isVeg, isBestSeller, isRecommended, isAvailable
- preparationTimeMin, sortOrder, stock
- rating, ratingCount
