# Inventory — Complete Flow

## User Journey
1. Admin clicks Inventory tab → initInventory() fires
2. One-time read of /businesses/{bid}/outlets/{oid}/menu for all businesses
3. Table renders: Dish Name, Business, Outlet, Price, Category, Stock, Available, Actions
4. Admin can:
   a. **Search**: Type in search box → filters by dish name or business name
   b. **Increase Stock**: Click "+" → adjustStock(bid, oid, dishId, +1) via transaction
   c. **Decrease Stock**: Click "-" → adjustStock(bid, oid, dishId, -1) via transaction (gated at 0)
   d. **Toggle Availability**: Click toggle → toggleAvailability() flips available boolean
5. No data change listener — must refresh page to see updates from other sources

## Stock Adjustment Flow
Click "+" → adjustStock(bid, oid, dishId, 1) →
  transaction on /businesses/{bid}/outlets/{oid}/menu/{dishId}/stock →
  current = (current || 0) + 1 → write back → UI updates

## Availability Toggle Flow
Click toggle → toggleAvailability(bid, oid, dishId, current) →
  writes /businesses/{bid}/outlets/{oid}/menu/{dishId}/available = !current →
  badge updates (green ↔ red)
