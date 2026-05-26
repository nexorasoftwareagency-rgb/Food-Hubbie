# Riders — Complete Flow

## User Journey
1. Admin clicks Riders tab → initRiders() fires
2. Real-time listener on /riders → table renders (paginated 20/page)
3. Admin can:

### Add Rider
1. Click "Add Rider" → riderModal (add mode)
2. Fill required fields (Name*, Email*, Password*) + optional fields
3. Click Save → riderSave():
   a. Validate name + email not empty
   b. POST to identitytoolkit REST API {email, password}
   c. Get localId from response
   d. Write rider data to /riders/{localId}
   e. Success toast, modal closes, table updates

### Edit Rider
1. Click "Edit" → riderModal (edit mode, pre-filled)
2. Modify fields (password field hidden)
3. Click Save → riderSave() updates /riders/{uid}

### Delete Rider
1. Click "Delete" → confirmAction("Delete rider?")
2. Confirm → deleteRider() removes /riders/{uid}
3. Firebase Auth account remains (orphaned)

### Reset Password
1. Click "Reset Password" → sendPasswordResetEmail(riderEmail)
2. Firebase sends reset email
3. Toast: "Password reset email sent"
