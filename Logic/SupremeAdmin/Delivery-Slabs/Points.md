# Delivery Slabs — Points

## Key Implementation Details
- Stored as array — unusual RTDB pattern (risks concurrent write conflicts)
- prompt() used for all data entry — no proper form validation
- saveSlabs() replaces entire array (not per-element update)
- btnSaveDeliveryFlow exists but has no handler (Slabs auto-save anyway)

## Fixed Bugs
1. ~~**HIGH**: initMap["delivery-slabs"] never reached — data-tab="delivery" maps differently~~ **FIXED**
2. ~~**MEDIUM**: btnSaveDeliveryFlow exists in HTML but no JS event handler~~ **FIXED**
3. **LOW**: No validation on prompt inputs (text instead of numbers accepted)
4. **LOW**: No range overlap validation — admin can create conflicting slabs

## Gotchas
- Array index is the only slab identifier — removing index 1 shifts all subsequent indices
- No UI indication of which slab range applies to which distance
- All slab edits use prompt() — no proper modal form
- Cancel on prompt() leaves data in inconsistent state
- No "add slab" button in HTML — only remove/edit operations from rendered rows
- No visual confirmation before saveSlabs() overwrites the entire array
