# Settings — Code Logics

## Initialization
- initSettings() calls loadTFAStatus()
- Renders TFA section and Data Retention section

## TFA (Two-Factor Authentication) — STUB

### loadTFAStatus()
- Reads /system/admins/{currentAdminUid}/tfaSecret
- If tfaSecret exists: show "Disable 2FA" button + "Enabled" badge
- If no tfaSecret: show "Enable 2FA" button

### Enable TFA
1. generateTFASecret():
   - Generates random base32 string (20 characters from A-Z, 2-7)
   - Shows secret in tfaSetupModal
   - NOT OTPAuth spec compliant — no proper TOTP URI
2. Admin enters 6-digit code from authenticator app
3. verifyTFASetup():
   - Calls generateTOTP(secret) to verify
   - **BUG**: generateTOTP() always returns "000000"
   - Any 6-digit code passes verification
4. On "verification": writes tfaSecret to /system/admins/{uid}/tfaSecret
5. Shows success dialog

### Verify TOTP — BROKEN
- generateTOTP(secret):
  - Imports crypto.subtle for HMAC-SHA1
  - Uses epoch time / 30000 for time step
  - **BUG**: Returns "000000" when crypto.subtle exists (line ~1998)
  - Falls through to return "000000" — always returns zero
- base32Decode(s):
  - Decodes base32 string to Uint8Array
  - Mapping: A-Z → 0-25, 2-7 → 26-31

### Disable TFA
- confirmAction → removes /system/admins/{uid}/tfaSecret
- Shows success toast

## Data Retention

### runRetention(type)
1. Reads type: "orders", "audit", or "settlements"
2. Reads days threshold from input
3. Computes cutoff timestamp: Date.now() - (days * 86400000)
4. Iterates matching records:
   - If action === "archive": copies record to /archives/{type}/{path}
   - If action === "purge": deletes record directly
5. Shows toast with count of processed records

### Archive Flow
- Orders: reads all businesses → outlets → orders, filters by age, copies to /archives/orders/{bid}/{oid}/{orderId}
- Audit: reads from each audit path, filters by age, copies to /archives/audit/{path}/{key}
- Settlements: reads from each business → outlet → settlements, filters by age, copies to /archives/settlements/{bid}/{oid}/{sId}

### Purge Flow
- Same as archive but skips the copy step — directly removes records
