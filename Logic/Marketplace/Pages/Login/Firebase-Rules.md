# Login Page — Firebase Rules

## Paths Read
- `users/{userId}` — after auth, checks if user profile exists

## Paths Written
- `users/{userId}` — creates/updates user profile on first sign-in
- `logs/marketplaceAudit` — audit log for login event

## Auth
- Firebase Auth: Google provider
- `authService.handleRedirectResult()` creates user doc in RTDB if new
- No custom claims used
