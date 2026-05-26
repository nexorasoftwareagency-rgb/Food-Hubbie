# Riders — Points

## Key Implementation Details
- Auth account creation uses public REST API (not Admin SDK)
- API key exposed in HTML source — anyone can call identitytoolkit
- Delete rider removes RTDB record but NOT Auth account
- Password reset uses Firebase's sendPasswordResetEmail
- No role/status management beyond basic "status" field

## Known Issues
- Deleting rider does not disable Firebase Auth account (orphaned Auth user)
- No way to suspend/block a rider (only full delete)
- Password not validated for strength before sending to identitytoolkit
- No duplicate email check before creation (identitytoolkit will error)
- No error handling for identitytoolkit API failures

## Gotchas
- Created riders can log into Firebase Auth-enabled apps
- No restriction on what authenticated riders can access
- Aadhar number stored in plaintext — GDPR/DPDP compliance concern
- No rider profile photo or document upload
- No rider assignment tracking in this tab
