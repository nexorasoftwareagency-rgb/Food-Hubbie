# OutletDetails Page — Points

## Edge Cases
- **Outlet not found** (slug/ID invalid) → "Restaurant not found" page with link back
- **No menu items** → empty category shows nothing; "All" tab shows empty state
- **Outlet closed** → `canOrder()` prevents add-to-cart; items still visible
- **All items sold out** → items shown with "Sold Out" indicator; add-to-cart disabled
- **No location** → distance shows "— km"; delivery fee uses default slab

## Gotchas
- `searchQuery` and `dietFilters` are mutually exclusive — diet filters disabled during search
- Category list includes "All", "Recommended", "Best Sellers" even if 0 items match those categories
- Dual routing (`/store/:slug` vs `/outlet/:id`) could cause confusion if both are valid for same outlet

## Future Improvements
- Add infinite scroll or "Load More" for large menus
- Add nutritional info / dietary tags (vegan, gluten-free)
- Add "Reorder" button for past orders from this outlet
