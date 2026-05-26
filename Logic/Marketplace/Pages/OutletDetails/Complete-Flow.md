# OutletDetails Page — Complete Flow

## User Journey

```
1. User navigates to /store/{slug} or /outlet/{id}
2. URL param resolved:
   ├─ slug → fetchOutletBySlug(slug) → slugs/outlets/{slug} → { bizId, outletId }
   └─ id → fetchOutletById(id)
3. Outlet loaded → state.outlet set
4. fetchMenuByOutlet(id, bizId) → menuItems set
5. Categories computed: All, Recommended, Best Sellers, + dynamic
6. Render:
   ├─ Header: name, cuisine, rating, delivery time, distance, offers
   ├─ Category tabs (horizontal scroll)
   ├─ Search input + dietary filter toggles
   ├─ FoodCard grid:
   │   ├─ Image, name, description, price, rating
   │   ├─ Veg/non-veg badge, best-seller badge
   │   └─ "Add" button → opens ProductCustomizationModal
   └─ FloatingCart badge (if items in cart)
7. User taps "Add" → ProductCustomizationModal:
   ├─ Select size (if multiple)
   ├─ Select addons
   ├─ Select crust (if applicable)
   ├─ Extra cheese toggle
   ├─ Quantity selector
   └─ "Add to Cart" → CartContext dispatches ADD_ITEM
8. Category tab switch → filtered displayItems update instantly
9. Search input → debounced re-filter
10. Dietary filter toggle → re-filter (disabled during search)
```
