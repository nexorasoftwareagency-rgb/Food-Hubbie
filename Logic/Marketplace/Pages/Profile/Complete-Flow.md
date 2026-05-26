# Profile Page — Complete Flow

```
1. User navigates to /profile
2. AuthContext provides user data (synced from Firebase via onValue listener)
3. Render:
   ├─ Avatar + name + phone + email
   ├─ "Edit" button → inline edit fields → save to Firebase
   ├─ Wallet card with balance + "Add Funds"
   ├─ Transaction history list (date, amount, description, credit/debit)
   ├─ Saved addresses list with Home/Work/Other labels
   │   ├─ Add new address
   │   ├─ Edit existing address
   │   └─ Delete address
   └─ Settings section:
       ├─ Notification preferences (placeholder)
       ├─ App version
       └─ Logout button → signOut() → redirect to /
```
