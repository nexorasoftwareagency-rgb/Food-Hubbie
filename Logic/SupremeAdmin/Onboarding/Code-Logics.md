# Onboarding — Code Logics

## Initialization
- initOnboarding() called from showTab → initMap
- Attaches real-time listener on /onboarding_requests

## Real-Time Listener
- Listens on /onboarding_requests
- Renders table with: businessName, ownerName, email, phone, address, outletName, timestamp, actions

## Key Functions

### approveOnboarding(requestId, requestData)
1. Generates businessId: "biz_" + Date.now()
2. Creates business record at /businesses/{businessId}
3. Creates outlet at /businesses/{businessId}/outlets/{outletId} ("outlet_main")
4. Creates admin record at /system/admins/{adminId}
5. Deletes onboarding request at /onboarding_requests/{requestId}
6. Shows success toast

### rejectOnboarding(requestId)
1. Shows confirmAction dialog
2. On confirm: removes /onboarding_requests/{requestId}

### provisionNew (from Provision modal)
- Opens onboardingModal with empty fields
- BusinessName, OwnerName, AdminEmail (required), Phone, Address, OutletName, Lat, Lng

### onboardingSave()
1. Reads form fields from onboardingModal
2. Validates businessName and adminEmail are non-empty
3. Generates bid/oid/adminId
4. Creates business, outlet, and admin records
5. Closes modal, shows success toast

### autoGenerateIds
- bid: "biz_" + Date.now()
- oid: "outlet_" + Date.now()
- adminId: "admin_" + Date.now() + random chars

## Table Columns (BUG)
- HTML header uses colspan="6" (6 columns)
- Rendered table rows insert 9 cells
- Column mismatch: header shows businessName, ownerName, email, phone, address, status (no outletName, date, actions)
- Actual row cells: businessName, ownerName, email, phone, address, outletName, date, approve btn, reject btn
