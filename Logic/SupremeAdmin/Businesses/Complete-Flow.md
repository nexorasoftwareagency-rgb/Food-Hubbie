# Businesses — Complete Flow

## User Journey
1. Admin clicks Businesses tab → initBusinesses() fires
2. Real-time listener on /businesses + /system/admins
3. Table renders with all businesses (paginated 20/page)
4. Admin can:
   a. **Search**: Type in search box → filterBusinesses() filters by name/owner/email
   b. **Navigate pages**: Click pagination buttons
   c. **Edit Outlet**: Click "Edit" → outletEditModal opens with current data
      - Modify name, address, phone, lat, lng
      - AdminEmail and AdminPassDisplay shown (readonly)
      - Click Save → outletEditSave() writes to RTDB
   d. **Set Commission**: Click "Commission" → commissionModal opens
      - Enter percent (e.g., 15) and fixedFee (e.g., 10)
      - Click Save → commissionSave() writes to RTDB

## Edit Outlet Flow
Edit button → showModal → fill fields → Save → outletEditSave(bid, oid) → 
  updates /businesses/{bid}/outlets/{oid} → listener fires → table updates

## Commission Flow
Commission button → showModal → fill fields → Save → commissionSave(bid, oid) → 
  updates /businesses/{bid}/commission → listener fires → table updates
