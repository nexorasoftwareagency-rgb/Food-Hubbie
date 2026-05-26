# Settings Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Infrastructure" tab
2. loadInfrastructure() — renders static system telemetry
3. loadTFAStatus() called:
   ├─ db.ref('system/admins/{uid}/tfa').once('value')
   ├─ If enabled → show Disable button, status "Enabled"
   └─ If not → show Enable button, status "Not configured"
```

## Enable 2FA Flow
```
1. Admin taps "Enable 2FA"
2. showTFASetup():
   ├─ Generate OTPAuth.Secret({ issuer: "Foodhubbie Pro" })
   ├─ Store temp secret
   ├─ Create QR code via new QRCode('tfaQRCode', { text: otpauthUrl })
   ├─ Show manual secret text
   └─ Show verify input + "Verify & Enable" button
3. Admin scans QR with authenticator app
4. Admin enters 6-digit code
5. verifyTFASetup():
   ├─ Read code from #tfaVerifyInput
   ├─ Validate via OTPAuth.TOTP.validate({ secret, token: code })
   ├─ If valid:
   │   ├─ db.ref('system/admins/{uid}/tfa').set({ enabled: true, secret: tempSecret })
   │   ├─ showToast("2FA enabled successfully")
   │   └─ Update buttons
   └─ If invalid → showToast("Invalid code, try again")
```

## Disable 2FA Flow
```
1. Admin taps "Disable 2FA"
2. SweetAlert2 confirm
3. On confirm:
   ├─ db.ref('system/admins/{uid}/tfa').remove()
   └─ showToast("2FA disabled")
```

## Data Retention Flow
```
1. Admin selects retention period + action for each type
2. Taps "Apply Policy" for Orders:
   ├─ Show #retentionStatus spinner
   ├─ processRetentionOrders():
   │   ├─ For each business → outlet
   │   ├─ Query orders older than retention period
   │   ├─ For each old order:
   │   │   ├─ If archive: write to archives/... ; remove from source
   │   │   ├─ If purge: remove from source only
   │   │   └─ Update progress text: "Archiving order X of Y"
   │   └─ showToast("Orders retention complete — X orders processed")
   └─ Hide spinner
3. Same flow for Audit Logs and Settlements
```
