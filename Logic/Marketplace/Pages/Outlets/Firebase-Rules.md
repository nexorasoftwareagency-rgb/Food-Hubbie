# Outlets Page — Supporting Files

## Firebase Rules
- Public read on `businesses/{bizId}/outlets/{outletId}`

## Database Structure
- Uses same outlet schema as Home (see `04-Database-Structure.md`)

## Points
- No pagination — all outlets loaded at once
- Distance-based sorting requires geolocation permission
- Veg filter is cosmetic — outlets may have veg + non-veg items
