# Card Components — Overview

## FoodCard
- Displays menu item image, name, description, price, rating
- Veg/non-veg badge (green/red dot)
- Best-seller badge (amber highlight)
- "Add" button → opens ProductCustomizationModal
- Framer Motion staggered animation on mount
- Sold-out overlay when `isAvailable === false` or `stock === 0`
- Used in: Home (global menu), OutletDetails (menu grid)

## OutletCard
- Displays outlet cover image, logo, name, cuisine
- Rating with star icon and count
- Delivery time range (min–max min)
- Distance from user (km)
- Open/closed indicator badge
- Offer label strip (if any offers)
- Used in: Home (featured/trending), Outlets (full list), Search (results)

## Points
- Both cards receive `delay` prop for staggered Framer Motion animations
- `FoodCard` `item` prop expects full `MenuItem` type
- `OutletCard` expects full `Outlet` type
- Images use `<img>` with no fallback placeholder (broken image shows alt text)
