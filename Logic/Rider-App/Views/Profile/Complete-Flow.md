# Profile View — Complete Flow

## Page Load Sequence
```
1. Rider navigates to "Profile" from sidebar
2. window.showProfile() called
3. Read riders/{uid} (once)
4. Populate all profile fields:
   ├─ Photo (or initials fallback)
   ├─ Name, phone, email
   ├─ Address, vehicle, status toggle
   ├─ Aadhar (masked), aadhar image
   ├─ Father name, age, qualification
   └─ Bank details
5. Set status toggle position based on current status
6. Show profile completeness percentage
```

## Photo Upload Flow
```
1. Rider taps profile photo
2. File picker opens (accept="image/*")
3. On file select:
   a. Validate size ≤ 5MB
   b. Validate type is image/JPEG or image/PNG
   c. Upload to storage/riders/{uid}/profile.jpg via uploadBytesResumable
   d. Show progress bar during upload
   e. On complete: getDownloadURL
   f. Update riders/{uid}/photoURL
   g. Update image src with new URL
   h. Show success toast
4. On error: show error toast, keep old photo
```

## Edit Field Flow
```
1. Rider taps edit icon on field
2. Input appears (text/textarea/number/select based on field type)
3. Rider modifies value
4. Rider taps "Save" or checkmark
5. Update riders/{uid}/fieldName = newValue
6. Show success toast "Profile updated"
7. Update display value
```

## Status Toggle Flow
```
1. Rider taps online/offline toggle
2. Show confirmation: "Go offline? You won't receive new orders"
3. If confirmed:
   a. Update riders/{uid}/status = "offline"
   b. onDisconnect still handles connection drops
   c. Stop order pings
   d. Update toggle UI
4. If toggle to online:
   a. Update riders/{uid}/status = "online"
   b. Resume order listeners
   c. Update toggle UI
```

## Logout Flow
```
1. Rider taps "Logout" button
2. Show confirmation modal: "Are you sure?"
3. If confirmed:
   a. Stop location tracking (clearWatch)
   b. Update status to "offline"
   c. Remove onDisconnect handler
   d. auth.signOut()
   e. Clear cached data (localStorage)
   f. Redirect to #auth-section (login page)
```
