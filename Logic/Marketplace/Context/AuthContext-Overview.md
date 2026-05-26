# AuthContext — Overview

## Purpose
Manages Firebase Authentication state, Google sign-in, and user profile sync from Realtime Database.

## State
| Field | Type | Description |
|---|---|---|
| `user` | `User \| null` | Current user profile (merged from Auth + RTDB) |
| `authState` | `"loading" \| "authenticated" \| "unauthenticated"` | Auth lifecycle |

## Key Functions
| Function | Description |
|---|---|
| `signInWithGoogle()` | Calls `authService.signInWithGoogle()` (redirect-based) |
| `signOut()` | Calls Firebase `signOut()`, clears user state |
| `updateUser(updates)` | Writes name/phone/email to `users/{uid}` via authService |

## Internal Logic
- `handleRedirectResult()` processes Google OAuth return on mount
- `subscribeToAuthChanges()` listens to `onAuthStateChanged`
- `onValue` listener on `users/{userId}` syncs wallet balance, addresses, loyalty points in real-time
- During loading, renders nothing (splash/loading state expected from parent)

## Firebase
- **Reads**: `users/{userId}` (real-time via `onValue`)
- **Writes**: `users/{userId}` (profile updates)
- **Auth**: Google provider (redirect)

## Points
- User object is a merge of Firebase Auth user + RTDB profile data
- Wallet history sorted by timestamp descending
- FCM permission requested after successful authentication
- Loading state prevents flash of unauthenticated UI during redirect processing
