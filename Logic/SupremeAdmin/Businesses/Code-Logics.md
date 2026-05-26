# Businesses — Code Logics

## Initialization
- initBusinesses() attaches real-time listener on /businesses
- Also reads /system/admins to map admin emails to businesses

## Real-Time Listener
- Listens on /businesses
- On data change: filters, paginates, and renders table
- Data stored in global businessesData array
- Also loads system/admins for admin email lookup

## Pagination
- renderBusinessesPage(page): slices businessesData array (20 per page)
- renderPagination() generates pagination controls
- Current page tracked in currentBusinessesPage

## Search/Filter
- filterBusinesses(): filters by name, owner, or email (case-insensitive)
- Filtered results used for pagination and render

## Table
- Columns: Business Name, Owner, Email, Phone, Outlets Count, Admin, Actions
- Actions: Edit Outlet, Commission

## Edit Outlet Modal
- opens outletEditModal with current outlet data
- Fields: Name, Address, Phone, Lat, Lng, AdminEmail (readonly), AdminPassDisplay (readonly)
- outletEditSave() writes to businesses/{bid}/outlets/{oid}

## Commission Modal
- opens commissionModal with current commission values
- Fields: Percent (%), Fixed Fee (₹)
- commissionSave() writes to businesses/{bid}/commission

## Admin Mapping
- Reads /system/admins to find admin email for each business
- admin.businessId === business bid used for matching
- If no admin found, shows "N/A"
