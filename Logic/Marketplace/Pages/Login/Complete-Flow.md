# Login Page — Complete Flow

```
1. User navigates to /login (from nav, checkout wall, or profile)
2. AuthContext provides authState:
   ├─ "authenticated" → redirect to / (or previous page)
   └─ "unauthenticated" → show login UI
3. User taps "Sign in with Google"
4. authService.signInWithGoogle() called:
   ├─ signInWithRedirect(auth, googleProvider)
   └─ Browser redirects to Google OAuth consent screen
5. User grants permission → browser redirects back to /login
6. AuthContext.initAuth runs:
   ├─ handleRedirectResult() → processes OAuth result
   ├─ Creates/updates user profile in users/{userId}
   ├─ Sets authState = "authenticated"
   └─ Requests FCM notification permission
7. User redirected to home or previous page
```
