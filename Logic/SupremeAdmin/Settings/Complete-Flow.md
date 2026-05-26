# Settings — Complete Flow

## TFA Setup Flow
1. Admin clicks Settings tab → initSettings() → loadTFAStatus()
2. If no TFA: "Enable 2FA" button shown
3. Admin clicks "Enable 2FA" → tfaSetupModal opens
4. generateTFASecret() generates random base32 string
5. QR code rendered for scanning with authenticator app
6. Admin scans QR code or enters secret manually
7. Admin enters 6-digit code from authenticator
8. verifyTFASetup() awaits generateTOTP(secret) — computes proper HMAC-SHA1
9. Code verified → tfaSecret saved to /system/admins/{uid}/tfaSecret
10. Success dialog shown

## TFA Disable Flow
1. "Disable 2FA" button shown when TFA enabled
2. Admin clicks → confirmAction
3. On confirm: removes /system/admins/{uid}/tfaSecret
4. Toast: "2FA Disabled"

## Data Retention Flow
1. Admin selects type: Orders / Audit Logs / Settlements
2. Enters days threshold (records older than this many days)
3. Selects action: Archive or Purge
4. Admin clicks "Run Retention"
5. runRetention() executes:
   a. Computes cutoff = Date.now() - (days * 86400000)
   b. Iterates matching records
   c. If archive: copies to /archives/{type} then deletes original
   d. If purge: deletes original directly
6. Toast: "Processed X records"

## Archive vs Purge
- **Archive**: /archives/orders/{bid}/{oid}/{orderId} ← copy
  Then delete original from /businesses/{bid}/outlets/{oid}/orders/{orderId}
- **Purge**: Direct delete from original path (no copy)
