# Riders — Code Logics

## Initialization
- initRiders() attaches real-time listener on /riders
- Stores data in global ridersData array

## Real-Time Listener
- Listens on /riders
- On data change: filters, paginates, renders table

## Pagination
- renderRidersPage(page): 20 per page
- currentRidersPage tracks page state

## Search/Filter
- Client-side search by name, email, or phone
- Case-insensitive includes match

## CRUD Operations

### Add Rider
1. riderModal (add mode): Name*, Email*, Password*, Phone, FatherName, Age, AadharNo, Qualification, Address
2. riderSave():
   a. Validates name and email are required
   b. Creates Firebase Auth account via REST API:
      POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}
      Body: {email, password, returnSecureToken: true}
   c. Gets localId from API response
   d. Writes rider data to /riders/{localId}
   e. Closes modal, shows success toast

### Edit Rider
1. riderModal (edit mode): Same fields minus Password
2. riderSave() writes updated data to /riders/{uid}

### Delete Rider
1. confirmAction("Delete rider?") → deleteRider(uid)
2. Removes /riders/{uid}
3. Note: Does NOT delete Firebase Auth account (only RTDB record)

### Reset Password
1. resetRiderPassword(email) → auth.sendPasswordResetEmail(email)
2. Firebase sends password reset email to rider

## Firebase Auth REST API
- Endpoint: identitytoolkit.googleapis.com/v1/accounts:signUp
- API Key hardcoded in index.html (exposed)
- Returns localId (UID) used as RTDB key
- No Admin SDK — uses web API key for user creation
