# Outlets Page — Code Logics

## Overview
Full list of all outlets with sorting and filtering.

## State
- `outlets` — all outlets fetched via `fetchOutlets()`
- `sortBy` — rating / distance / delivery time / name
- `filterQuery` — text filter by name or cuisine
- `filterVeg` — veg-only toggle

## Logic
- Sorts outlets client-side based on selected sort option
- Filters by text query (name/cuisine match) and dietary preference
- Shows distance from user location (from LocationContext)
- OutletCard component for each result

## Decisions
- **Client-side sorting/filtering** — all data already fetched; instant UI response
- **No pagination** — assumes reasonable number of outlets for a city area
- **Distance sorting requires location** — falls back to name sort if location denied
