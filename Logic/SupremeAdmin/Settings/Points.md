# Settings — Points

## TFA (Broken)

### Key Implementation Details
- generateTFASecret() creates random 20-char base32 string
- No OTPAuth URI generated (can't scan QR code with authenticator app)
- Secret displayed as plain text — admin must manually type into authenticator
- generateTOTP() is broken — returns "000000" regardless of input

### Fixed Bugs
1. ~~**HIGH**: generateTOTP() returns "000000" when crypto.subtle exists~~ **FIXED**
   - Now properly computes HMAC-SHA1 via crypto.subtle.sign with truncation
2. **MEDIUM**: No OTPAuth URI — can't scan QR code
3. **LOW**: Secret shown as plain text — shoulder-surfing risk

## Data Retention

### Key Implementation Details
- Retention is manual — no automated scheduling
- Archive before purge provides safety net
- No undo for purge (data deleted permanently)
- No audit logging for retention actions

### Known Issues
- No confirmation of how many records will be affected before execution
- No dry-run mode to preview what would be deleted
- Large archives could balloon RTDB storage (data copied, not moved)
- No archive cleanup or lifecycle management
- Retention applies to ALL businesses — no per-business policy

### Gotchas
- "Archive" COPIES data before deleting (data stored twice temporarily)
- "Purge" DELETES directly (no copy) — irreversible
- Archive path /archives/orders/{bid}/{oid}/{orderId} preserves original structure
- No way to restore archived data from the UI
- Retention days input accepts any number — no maximum validation
