# SuperAdmin — Two-Factor Authentication

## Overview
TOTP-based 2FA using OTPAuth library (SHA1, 6-digit, 30-second period). Compatible with Google Authenticator, Authy, Microsoft Authenticator, and any standard TOTP app.

## Library Dependencies
```html
<script src="https://cdn.jsdelivr.net/npm/otpauth@9.2.2/dist/otpauth.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

## 2FA Flow

### Setup
```
1. Admin clicks "Enable 2FA"
2. showTFASetup():
   a. Generate secret:
      new OTPAuth.Secret({ size: 20 })
   b. Create TOTP object:
      new OTPAuth.TOTP({
        issuer: "Foodhubbie Pro",
        label: adminEmail,
        secret: tempSecret,
        algorithm: "SHA1",
        digits: 6,
        period: 30
      })
   c. Generate otpauth:// URL → pass to QRCode.js
   d. Display QR code in #tfaQRCode div
   e. Display base32 secret in #tfaSecretDisplay
3. Admin scans QR with authenticator app
4. Admin enters 6-digit code from app
5. verifyTFASetup():
   a. Read code from #tfaVerifyInput
   b. Validate:
      const totp = new OTPAuth.TOTP({ secret: tempSecret });
      const delta = totp.validate({ token: code, window: 1 });
   c. If delta !== null → valid → save to DB
   d. If delta === null → invalid → show error
6. On success:
   db.ref('system/admins/{uid}/tfa').set({ enabled: true, secret: tempSecret.toString() })
```

### Login Verification
```
1. Admin enters email + password → signInWithEmailAndPassword
2. checkAuth() runs on onAuthStateChanged
3. Read system/admins/{uid}/tfa
4. If tfa.enabled → show #tfaModal
5. Admin enters 6-digit code
6. submitTFACode() → verifyTFACode():
   const totp = new OTPAuth.TOTP({ secret: storedSecret, digits: 6, period: 30 });
   const delta = totp.validate({ token: code, window: 1 });
   if delta !== null → allow access, hide modal
   if delta === null → show error, retry
```

### Disable
```
1. Admin clicks "Disable 2FA"
2. SweetAlert2 confirm
3. db.ref('system/admins/{uid}/tfa').remove()
```

## DB Schema
`system/admins/{uid}/tfa`
| Field | Type | Description |
|---|---|---|
| `enabled` | boolean | 2FA active |
| `secret` | string | TOTP base32 secret |

## Security Notes
- Secret stored in Firebase RTDB (not ideal — server-side/HSM storage preferred)
- `window: 1` allows ±30 second clock drift tolerance
- No backup codes implemented (if phone lost, admin must contact supreme admin to disable TFA in DB)
- QR code rendered client-side; secret visible in DOM during setup
