# Inventory Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Inventory Control" tab
2. loadInventory() called:
   ├─ db.ref('businesses').once('value', (snap) => {
   │   ├─ Iterate all businesses → outlets → dishes
   │   ├─ Build globalInventory[] array
   │   ├─ Compute KPIs: lowStockCount, totalActiveItems, outOfStockCount
   │   ├─ renderInventoryTable(inventory): build table rows
   │   └─ lucide.createIcons()
   │   })
```

## Stock Adjustment Flow
```
1. Admin finds dish row in inventory table
2. Taps "+" to increase stock by 1
3. quickAdjustStock(dishId, +1, outletPath):
   ├─ Read current stock from globalInventory
   ├─ newStock = current + 1
   ├─ Update Firebase: dishes/{dishId}/stock = newStock
   ├─ Update Firebase: dishes/{dishId}/lastStockUpdate = Date.now()
   ├─ Update local inventory array
   └─ Re-render affected row
4. Taps "-" to decrease → newStock = Math.max(0, current - 1)
```

## Toggle Availability Flow
```
1. Admin taps toggle button on dish row
2. toggleAvailability(dishId, outletPath, currentState):
   ├─ newState = !currentState
   ├─ Update Firebase: dishes/{dishId}/isAvailable = newState
   ├─ Update local inventory array
   └─ Re-render affected row badge
```

## Search Flow
```
1. Admin types in #inventorySearch
2. filterInventory() on keyup:
   ├─ Filter globalInventory by dish.name or outlet name
   └─ renderInventoryTable(filtered)
```
