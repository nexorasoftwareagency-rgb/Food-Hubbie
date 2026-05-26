# Search Page — Supporting Files

## Firebase Rules
- All reads are public (outlets + dishes)
- No authentication required for search

## Database Structure
- Uses same data as Home page (outlets + dishes)
- No additional database paths

## Points
- Search is entirely client-side — no Firebase query filtering
- Accuracy depends on `fetchOutlets()` + `fetchAllMenuItems()` having been called first
