# Search Page — Quick Reference

## Firebase Paths
- Reads: `businesses/{bizId}/outlets/{outletId}` (already in memory from Home)

## No Writes
Search page is read-only; no Firebase writes.

## Edge Cases
- Empty query → show prompt or recent searches
- No results → "No outlets or dishes found" empty state
- Special characters in query → debounced filter handles gracefully

## Flow
```
URL /search?q=pizza
  → Parse query param
  → Filter cached outlets by name/cuisine/tags matching "pizza"
  → Filter cached dishes by name/category matching "pizza"
  → Show tabbed results (Outlets | Dishes | All)
  → User types more → debounce → re-filter
  → User taps result → navigate to /store/{slug} or /outlet/{id}
```
