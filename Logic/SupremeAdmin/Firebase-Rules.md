# SupremeAdmin — Firebase Rules

## RTDB Security Rules
SupremeAdmin uses Firebase Realtime Database exclusively. Firestore SDK is loaded but never used.

### Auth Rules (Required)
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```
SupremeAdmin relies on Firebase Auth for access control. All data paths require authentication.

## Path-Level Access Patterns

### /businesses
- Read: admin authenticated
- Write: admin authenticated
- Sub-paths: outlets/{oid}, outlets/{oid}/orders, outlets/{oid}/menu, outlets/{oid}/reviews, outlets/{oid}/settlements

### /businesses/{bid}/outlets/{oid}/orders/{orderId}/status
- Write: admin authenticated (status updates)
- Used by: Live Orders tab, Settlements tab

### /businesses/{bid}/outlets/{oid}/menu/{dishId}
- Write: admin authenticated (stock adjustments, availability toggles)
- Used by: Inventory tab

### /businesses/{bid}/outlets/{oid}/reviews
- Read: admin authenticated
- No writes from SupremeAdmin (read-only)

### /businesses/{bid}/commission
- Write: admin authenticated
- Used by: Businesses tab (commission modal)

### /riders
- Read/Write: admin authenticated
- Contains PII (name, phone, fatherName, aadharNo, address)

### /users
- Read: admin authenticated
- Write: admin authenticated (wallet only)
- Contains wallet balance and walletHistory

### /users/{uid}/wallet
- Write: admin authenticated via transaction
- Must use transaction for atomic credit/debit

### /onboarding_requests
- Read: admin authenticated
- Write: admin authenticated (delete after approve/reject)

### /system/admins
- Read: admin authenticated
- Write: admin authenticated (TFA secret, business mapping)

### /system/promotions
- Read/Write: admin authenticated
- Sub-paths: surge, globalDiscount, coupons/{cid}

### /system/config/platformFee
- Read/Write: admin authenticated

### /system/settings/delivery/slabs
- Read/Write: admin authenticated
- Stored as array (not object)

### /system/broadcasts
- Write: admin authenticated (push)
- Read: admin authenticated (history)

### /system/auditLogs
- Write: admin authenticated (push from settlements, etc.)
- Read: admin authenticated

### /logs/marketplaceAudit
- Read: admin authenticated (aggregated in Audit tab)

### /logs/botAudit
- Read: admin authenticated (aggregated in Audit tab)

### /logs/riderErrors
- Read: admin authenticated (aggregated in Audit tab)

### /archives
- Write: admin authenticated (data retention archive)
- Read: admin authenticated

## Security Considerations
1. No role-based access — any authenticated admin has full read/write access
2. No data validation rules — all validation is client-side
3. No rate limiting at database level (handled client-side for broadcasts)
4. Rider Auth uses exposed API key in REST calls
5. TFA is a stub — no real 2FA protection
6. Audit trails rely on client-side writes (no server-side enforcement)
