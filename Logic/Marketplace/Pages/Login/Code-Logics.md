# Login Page — Code Logics

## Overview
Authentication page with Google sign-in as the primary method.

## State
- `authState` — from AuthContext (loading / authenticated / unauthenticated)
- `isSigningIn` — local loading state during Google redirect

## Key Logic
- **Google sign-in**: Calls `signInWithGoogle()` from AuthContext
  - Uses `signInWithRedirect` (mobile-friendly)
  - `handleRedirectResult()` processes the return on mount
- **Post-login redirect**: Navigates to previous page or home
- **Loading state**: Shows spinner during sign-in process
- **Error handling**: Toast on sign-in failure

## Decisions
- Google-only (no email/password, no phone OTP)
- Redirect-based sign-in (not popup) for mobile compatibility
- Auto-redirects authenticated users to home
- Simple UI with brand logo + Google button

## Firebase
- `authService.signInWithGoogle()` → `signInWithRedirect(auth, googleProvider)`
- `handleRedirectResult()` → `getRedirectResult(auth)` → creates/updates user profile in `users/{userId}`
