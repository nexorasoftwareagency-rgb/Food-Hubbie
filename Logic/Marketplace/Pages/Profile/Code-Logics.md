# Profile Page — Code Logics

## Overview
User profile management with wallet, address book, and settings.

## State & Data
- `user` — from `AuthContext`
- `walletBalance` — from `walletService.getWalletBalance(user.id)`
- `walletHistory` — transaction history
- `savedAddresses` — delivery addresses from user profile
- `editMode` — toggle for inline editing name/phone/email

## Key Sections
1. **Profile card**: Avatar, name, phone, email, edit button
2. **Wallet**: Balance display, transaction history list (credit/debit with timestamps)
3. **Saved addresses**: List of addresses with Home/Work/Other labels; add/edit/delete
4. **Settings**: Notification preferences (future), app version, logout button

## Decisions
- Profile data synced from Firebase via `AuthContext`'s `onValue` listener on `users/{userId}`
- Wallet shows both balance and full transaction history
- Edit mode uses `updateProfile()` from authService → writes to `users/{uid}`
- Logout calls `signOut()` from AuthContext → clears user state

## Firebase
- Reads: `users/{userId}` (owner only)
- Writes: `users/{userId}` (profile updates), `users/{userId}/wallet` (if adding funds)
