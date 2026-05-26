# Delivery Slabs — Code Logics

## Initialization (Partially Broken)
- initDeliverySlabs() mapped as initMap["delivery-slabs"]
- Nav link uses data-tab="delivery" — mapping never found
- If reached: listens on /system/settings/delivery/slabs

## Real-Time Listener
- Listens on /system/settings/delivery/slabs
- Data stored as array (not object — unique for RTDB)
- Calls renderSlabs() on data change

## renderSlabs()
- Renders table rows: Min Distance (km), Max Distance (km), Fee (₹), Actions (Edit/Remove)
- Slab data is an array of objects

## Slab Operations

### addSlab()
- Calls showSlabEditor(-1)
- Empty prompt for minDistance, maxDistance, fee
- Pushes to local slabsData array

### editSlab(idx)
- Calls showSlabEditor(idx)
- Pre-filled prompt with current values
- Updates slabsData[idx]

### removeSlab(idx)
- confirmAction → removes slabsData[idx]
- Calls saveSlabs()

### showSlabEditor(idx)
- Uses prompt() dialogs for each field (min distance, max distance, fee)
- If idx === -1: pushes new slab
- If idx >= 0: edits existing slab

### saveSlabs()
- Writes entire slabsData array to /system/settings/delivery/slabs
- Uses set() (replaces entire array)

## Save Button (Partially Broken)
- btnSaveDeliveryFlow exists in HTML but has **no event handler** in app.js
- Slabs are auto-saved after add/edit/remove operations via saveSlabs()
- The explicit Save button does nothing
