# Inventory — Code Logics

## Initialization
- initInventory() reads menu items from all businesses/outlets
- Iterates /businesses/{bid}/outlets/{oid}/menu/{dishId} for all businesses

## Data Loading
- One-time read (not listener) of all menu items across all businesses/outlets
- Flattens to array with business/outlet metadata attached
- Sorts alphabetically by dish name

## Search/Filter
- Client-side search by dish name or business name
- Case-insensitive includes match

## Stock Management

### adjustStock(bid, oid, dishId, delta)
- Uses Firebase transaction on /businesses/{bid}/outlets/{oid}/menu/{dishId}/stock
- Atomic increment/decrement by delta
- +/-1 buttons for quick adjustment
- Stock never goes below 0 (guarded in transaction)

### toggleAvailability(bid, oid, dishId, currentAvailable)
- Writes /businesses/{bid}/outlets/{oid}/menu/{dishId}/available = !currentAvailable
- Visual indicator: green badge for available, red for unavailable

## Table
- Columns: Dish Name, Business, Outlet, Price, Category, Stock, Available, Actions
- Actions: + (stock up), - (stock down), Toggle Availability

## Data Shape Accessed per Dish
```json
{
  "name": "Dish Name",
  "price": 150,
  "category": "Main Course",
  "stock": 50,
  "available": true,
  "image": "",
  "description": "Description"
}
```
