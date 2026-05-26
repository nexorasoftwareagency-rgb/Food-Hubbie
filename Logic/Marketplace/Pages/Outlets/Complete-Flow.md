# Outlets Page — Overview

## Firebase
- Reads: `businesses/{bizId}/outlets/{outletId}` (public)
- No writes

## Flow
```
/outlets
  → fetchOutlets() (may reuse Home cache)
  → Render outlet cards with name, cuisine, rating, delivery time, distance
  → User selects sort: Rating | Distance | Delivery Time | Name
  → User filters by text or veg-only toggle
  → Results update instantly (client-side)
  → Tap outlet → /store/{slug}
```

## Points
- Distance calculation uses Haversine from `outletService`
- "Open Now" indicator based on `availability` field
- Empty state if no outlets match filters
