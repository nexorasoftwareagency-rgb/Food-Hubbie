# Home Page — Code Logics

## Overview
Landing page with hero, cuisine grid, trending dishes, global menu, and reviews.

## State Variables
| Variable | Type | Source |
|---|---|---|
| `outlets` | `Outlet[]` | `fetchOutlets()` → sorted by distance |
| `bestSellers` | `MenuItem[]` | `getGlobalBestSellers(4)` |
| `recommended` | `MenuItem[]` | `getGlobalRecommended(4)` |
| `reviews` | `Review[]` | `fetchGlobalReviews(6)` |
| `cuisines` | `Cuisine[]` | `fetchCuisines()` |
| `allMenuItems` | `MenuItem[]` | `fetchAllMenuItems()` |
| `loading` | boolean | Initial load |

## Key Logic
- **Location**: Uses `LocationContext` state; shows Allow/Enable button if permission not granted
- **Hero search**: Form submit navigates to `/search?q={query}`
- **Computed**: `openOutlets` (filtered by `availability !== "closed"`), `fastDelivery` (sorted by time, top 4), `topRated` (sorted by rating, top 4)
- **Data loading**: `useEffect` triggered by `locationState.coords` change
- **Framer Motion**: Animated entry for hero, cuisine icons, outlet images, review cards

## Sections
1. Location banner (mobile only)
2. Hero with search bar + CTA
3. KPI strip (restaurants, open now, fastest delivery, top rated)
4. Cuisine categories (horizontal scroll)
5. Trending Now (best sellers grid)
6. Quick Bites (recommended items)
7. Explore All Restaurants CTA
8. Universal Menu (all items grid)
9. Customer Reviews
10. Pro Membership CTA banner
