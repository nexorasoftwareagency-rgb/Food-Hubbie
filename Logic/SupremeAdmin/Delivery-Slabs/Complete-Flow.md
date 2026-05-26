# Delivery Slabs — Complete Flow

## User Journey
1. Admin clicks "Service Slabs" tab → initDeliverySlabs() listens on /system/settings/delivery/slabs
2. Slabs table renders: Min Distance, Max Distance, Fee, Actions
3. Admin can:

### Add Slab
- showSlabEditor(-1) → prompt() for minDistance, maxDistance, fee
- Valid values entered → pushes to slabsData array
- saveSlabs() writes entire array to RTDB

### Edit Slab
- Click "Edit" on a slab row → showSlabEditor(index)
- prompt() pre-filled with current values
- Updated values saved to slabsData[index]
- saveSlabs() writes entire array

### Remove Slab
- Click "Remove" → confirmAction → removes slabsData[index]
- saveSlabs() writes entire array

### Save Button
- btnSaveDeliveryFlow calls saveSlabs() for explicit save
