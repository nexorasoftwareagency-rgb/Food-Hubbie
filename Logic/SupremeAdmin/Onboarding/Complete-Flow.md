# Onboarding — Complete Flow

## Partner Onboarding (Standard)
1. Partner submits request via marketplace/website
2. Request appears at /onboarding_requests/{id}
3. Admin clicks Onboarding tab → initOnboarding() listener fires
4. Request appears in table with business details
5. Admin reviews details in table (Business, Owner, Email, Phone, Address, Outlet, Date, Status)
6. **Approve**: confirmAction → approveOnboarding() →
   a. Generates biz_/outlet_/admin_ IDs
   b. Creates business record
   c. Creates outlet record
   d. Creates admin mapping
   e. Deletes onboarding request
   f. Success toast
7. **Reject**: confirmAction → rejectOnboarding() →
   a. Deletes onboarding request

## Partner Onboarding (Manual)
1. Admin clicks "Provision New"
2. Provision modal opens with empty fields
3. Admin fills: BusinessName*, OwnerName, AdminEmail*, Phone, Address, OutletName, Lat, Lng
4. Admin clicks Save
5. onboardingSave() validates required fields
6. Creates business + outlet + admin (same as approve flow)
7. Modal closes, success toast

## Result
- New business visible in Businesses tab
- New admin can log in with their email
- Business has single outlet "outlet_main"
