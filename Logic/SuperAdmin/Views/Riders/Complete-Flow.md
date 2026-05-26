# Riders Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Rider Management" tab
2. loadRiders() called:
   ├─ db.ref('riders').on('value', (snap) => {
   │   ├─ Parse all riders
   │   ├─ renderRidersList() → paginated table
   │   └─ lucide.createIcons()
   │   })
```

## Create Rider Flow
```
1. Admin taps "Add Partner"
2. showRiderModal(): empty form, editingRiderId = null
3. Admin fills: name, phone, email, password, vehicle, address
4. Admin optionally uploads: photo file, aadhar file
5. Admin taps "Save"
6. saveRider():
   ├─ If editingRiderId === null → Create:
   │   ├─ secondaryAuth.auth().createUserWithEmailAndPassword(email, password)
   │   ├─ If photo file selected → compressImage() → uploadRiderFile()
   │   ├─ If aadhar file selected → compressImage() → uploadRiderFile()
   │   ├─ db.ref('riders/{newUid}').set({ name, phone, email, ... })
   │   └─ logAdminAction('RIDER_CREATED', { uid, name })
   ├─ If editingRiderId exists → Update:
   │   ├─ Read form values
   │   ├─ Update db.ref('riders/{uid}').update({ name, phone, ... })
   │   └─ logAdminAction('RIDER_UPDATED', { uid })
   └─ Toast "Rider saved"
```

## Edit Rider Flow
```
1. Admin taps "Edit" on rider row
2. editRider(id):
   ├─ Read riders/{id} (once)
   ├─ Pre-fill form fields
   ├─ Set editingRiderId = id
   ├─ Show modal
```

## Delete Rider Flow
```
1. Admin taps "Delete" on rider row
2. SweetAlert2 confirm: "Remove {name}?"
3. On confirm:
   ├─ db.ref('riders/{uid}').remove()
   ├─ logAdminAction('RIDER_DELETED', { uid, name })
   └─ Toast "Rider removed"
```
