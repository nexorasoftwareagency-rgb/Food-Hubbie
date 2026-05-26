# Delivery Tab — Important Points

1. **Global config**: Applied to ALL outlets — no per-outlet override capability
2. **Slab array mutability**: `globalDeliverySlabs` array is mutated in-place by inline inputs, then saved as-is
3. **No validation on slabs**: Slab order and overlap not validated (e.g., 3km slab before 1km slab is allowed)
4. **Deploy writes entire object**: `saveGlobalDelivery()` calls `set()` on the whole `delivery` path, overwriting any concurrent changes
5. **Mode preservation**: `setDeliveryMode()` only updates UI visibility — both modes' data stays in memory
6. **Rate limit**: No rate limiting on save (could spam Firebase writes)
