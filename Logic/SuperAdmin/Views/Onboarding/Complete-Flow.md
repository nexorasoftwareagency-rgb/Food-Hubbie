# Onboarding Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Partner Requests" tab
2. Tab click handler: set title "Partner Approval Queue"
3. initOnboardingManager() called:
   ├─ db.ref('onboarding_requests').on('value', (snap) => {
   │   ├─ Parse request data
   │   ├─ Filter pending requests
   │   ├─ Update #pendingCount badge
   │   ├─ Build table rows (name, email, KYC, submitted date, actions)
   │   ├─ Set #onboardingTableBody.innerHTML
   │   └─ lucide.createIcons()
   │   })
   └─ #pendingCount badge in sidebar updated
```

## Approve Flow
```
1. Admin reviews request in table
2. Taps "Approve" button → SweetAlert2 confirm dialog
3. On confirm:
   ├─ Show loading state on button
   ├─ Read onboarding_requests/{uid}
   ├─ Generate random password
   ├─ secondaryAuth.auth().createUserWithEmailAndPassword(email, password)
   ├─ Build multi-path update object:
   │   ├─ businesses/{bid}.set(...)
   │   ├─ businesses/{bid}/outlets/{oid}.set(...)
   │   ├─ businesses/{bid}/outlets/{oid}/categories.set(defaultCategories)
   │   ├─ system/admins/{uid}.set(...)
   │   └─ slugs/outlets/{slug}.set(...)
   ├─ db.ref().update(updates)
   ├─ onboarding_history/{uid}.set(requestData)
   ├─ onboarding_requests/{uid}.remove()
   ├─ logAdminAction('PARTNER_APPROVED', { bid, oid, email })
   ├─ Toast "Partner provisioned successfully"
   └─ Table updates via real-time listener
```

## Reject Flow
```
1. Admin taps "Reject" → SweetAlert2 confirm
2. On confirm:
   ├─ onboarding_requests/{uid}.remove()
   ├─ logAdminAction('PARTNER_REJECTED', { uid, name, email })
   └─ Toast "Request rejected"
```

## Manual Provisioning Flow
```
1. Admin taps "Provision Node" button
2. View scrolls to #onboardingForm
3. Admin fills all fields
4. Form submit handler:
   ├─ Validate all required fields
   ├─ Generate random password for admin
   ├─ secondaryAuth.createUserWithEmailAndPassword(email, password)
   ├─ Same atomic pipeline as approvePartner
   ├─ Toast "Ecosystem node initialized"
   ├─ Reset form fields
   └─ Tab switch to Outlets or Businesses
```
