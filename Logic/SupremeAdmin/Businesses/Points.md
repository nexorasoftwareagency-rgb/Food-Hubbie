# Businesses — Points

## Key Implementation Details
- Outlet edit writes entire outlet object (replaces all fields)
- Commission writes {percent, fixedFee} as nested object
- No validation on commission values (percent could be > 100)
- Admin email display is read-only in edit modal
- Admin password display is likely dummy text (security concern if real)

## Known Issues
- No delete business functionality
- No way to add additional outlets after initial creation
- No business status toggle (active/inactive)
- Search doesn't filter by outlet name or admin email
- Pagination resets when real-time data changes

## Gotchas
- Commission applies to ALL outlets under this business
- Outlet edit doesn't update the admin mapping
- No confirmation on commission save
- AdminPassDisplay field shows password value — review if this exposes real credentials
