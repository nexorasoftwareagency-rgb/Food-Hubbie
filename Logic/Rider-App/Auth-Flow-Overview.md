# Rider App — Auth Flow Overview

## Authentication Provider
- Firebase Auth (Email/Password)
- All riders use email convention: `{phone}@rider.com`
- Password set during rider account creation (admin dashboard)

## Auth Lifecycle
```
1. App loads → onAuthStateChanged listener attached
2. No session → show #auth-section (login form)
3. Has session → verify role === "rider"
4. Session restored → initialize app, navigate to sec-home
5. Token refresh → handled automatically by Firebase SDK
6. Session expired → auth.signOut() → show login
```

## Login Flow
```
1. Rider enters phone + password in #auth-section
2. Preprocess: phone → email format (phone@rider.com)
3. auth.signInWithEmailAndPassword(email, password)
4. On success:
   a. Get user.uid
   b. Read riders/{uid} profile
   c. Verify role === "rider" AND isActive !== false
   d. Initialize app (load dashboard, start listeners)
   e. Set status = "online"
   f. Navigate to sec-home
5. On failure:
   a. Show error toast ("Invalid credentials")
   b. Clear password field
   c. Stay on login form
```

## Session Persistence
- Firebase Auth default persistence (localStorage)
- Session survives page refresh and browser close
- `onAuthStateChanged` handles page reload restoration

## Logout Flow
```
1. Rider taps "Logout" in sidebar
2. Confirmation modal
3. On confirm:
   a. Stop GPS watchPosition
   b. Remove all Firebase listeners
   c. Set riders/{uid}/status = "offline"
   d. Remove onDisconnect handler
   e. auth.signOut()
   f. Clear localStorage cached data
   g. Show login form (#auth-section)
```

## Security
| Concern | Mitigation |
|---|---|
| Session hijacking | Firebase Auth auto-refresh with short-lived tokens |
| Unauthorized access | Role check on every auth state change |
| Suspended account | isActive flag checked at login and periodically |
| Multiple devices | fcmTokens object handles multi-device FCM registration |
| Password reset | Not implemented for riders (handled by admin) |
