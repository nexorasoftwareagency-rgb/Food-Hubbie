# OutletDetails Page — Code Logics

## Overview
Store menu page with category tabs, search, dietary filters, and add-to-cart functionality.

## State Variables
| Variable | Type | Description |
|---|---|---|
| `outlet` | `Outlet \| null` | Fetched by slug or ID |
| `menuItems` | `MenuItem[]` | All dishes for this outlet |
| `activeCategory` | string | Current category tab ("All" default) |
| `searchQuery` | string | Menu search text |
| `dietFilters` | `Record<string, boolean>` | Veg/non-veg/spicy/bestseller toggles |

## Routing
- `/store/:slug` — primary SaaS route (resolves via `slugs/outlets/{slug}`)
- `/outlet/:id` — legacy route (direct ID lookup)

## Key Logic
- **Category tabs**: "All", "Recommended", "Best Sellers", + dynamic categories from menu
- **Menu filtering**: search → `searchMenu()` | category → `filterByCategory()` | diet → additional `.filter()`
- **Distance + delivery fee**: computed from `LocationContext.coords` + outlet location + `calcDeliveryFee()`
- **FoodCard**: Each dish rendered in `FoodCard` component with add-to-cart action
- **Outlet not found**: Link back to `/outlets`

## Header Info
- Outlet name, cuisine, rating, delivery time, distance
- Availability status + open/closed indicator
- Offers/tags display
