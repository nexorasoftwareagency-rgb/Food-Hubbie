# Onboarding — Points

## Key Implementation Details
- Approve creates 3 records atomically in Firestore (business, outlet, admin)
- No rollback if one write fails — partial data can be left behind
- AdminEmail is assumed to already exist in Firebase Auth (no verification)
- No notification sent to approved/rejected partner

## Fixed Bugs
- ~~Table column mismatch: HTML header defines 6 columns, rendered rows have 9 cells~~ **FIXED**
- Header now has 9 columns: Business, Owner, Email, Phone, Address, Outlet, Date, Status, Actions

## Gotchas
- Provision New bypasses the normal onboarding flow entirely
- No duplicate checking — same email can create multiple businesses
- Lat/Lng fields default to 0 if not provided (invalid coordinates)
- Admin password is never set — admin must use existing Auth account or password reset
- No audit log entry for approve/reject actions
