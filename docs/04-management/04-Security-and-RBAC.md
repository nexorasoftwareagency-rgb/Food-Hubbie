# Security & RBAC — Authentication, Authorization, Audit

**References**: `docs/03-foundation/03-Database-Security-Rules.md` (348-line rule audit), `docs/00-master/00-ARCHITECTURE.md` (RBAC tiers)

---

## 1. Code-Logics

### Authentication Methods

| App | Auth SDK | Methods | Secondary App | Notes |
|---|---|---|---|---|
| Marketplace | `firebase/auth` v12.13.0 | Google Sign-In, anonymous (guest) | No | `signInWithGoogle()` + redirect result handler |
| Admin Dashboard | `firebase/auth` v12.13.0 | Email/password | Yes — ephemeral app with `getAuth(secondaryApp)` | Can create/login rider accounts without displacing admin session |
| Rider App | `firebase/auth` v10.7.1 | Email/password | No | Simple `signInWithEmailAndPassword()` |
| SuperAdmin | `firebase/auth` compat v9.6.1 | Email/password + TOTP 2FA | No | TOTP codes from authenticator app |
| SupremeAdmin | `firebase/auth` compat v11.4.0 | Email/password | No | Admin-only access |
| Bot | `firebase-admin` v13.10.0 | Service account (Admin SDK) | No | Bypasses all security rules |

### TOTP 2FA (SuperAdmin specific)

| Component | File | Purpose |
|---|---|---|
| TOTP generation | `SuperAdmin/js/totp.js` | `generateTOTP(secret)` — HMAC-SHA1 OTP |
| QR provisioning | `SuperAdmin/js/qrcode.min.js` | Renders provisioning URI as QR for authenticator app |
| Secret storage | `system/admins/{uid}/tfaSecret` | Encoded base32 secret (validated by rules: `auth.uid === $uid`) |
| Verification | Login flow: enter OTP → `checkTOTP(code, secret)` → sets `sessionToken` | |

### RBAC Tier Definitions (5 levels)

| Role | Who | Scope | Primary App | RTDB read | RTDB write |
|---|---|---|---|---|---|
| **Marketplace User** | Public customer | Self (uid-scoped) | Marketplace | `users/{uid}/*`, `businesses/{bid}/*` (dish/meta only) | `users/{uid}/cart`, `orders/{pushId}` (own) |
| **Outlet Admin** | Shop staff | Single outlet | Admin Dashboard | `businesses/{bid}/outlets/{oid}/*` | Orders, menu, settings within that outlet |
| **Rider** | Delivery partner | Self | Rider App | `businesses/*/orders` (assigned), `riders/{uid}/*` | Own profile, assigned order status |
| **SuperAdmin** | Business owner | Single business | SuperAdmin | `businesses/{bid}/*`, `system/*`, `logs/*` | Business-level config, onboarding, promotions, riders |
| **SupremeAdmin** | Platform admin | System-wide | SupremeAdmin | Everything | System-level: settlements, broadcasts, user wallets, audit |

### Secondary Auth App (Admin Dashboard → Rider Actions)

In `admin-dashboard/src/firebase.js`:
```javascript
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

const secondaryApp = getApps().length <= 1
  ? initializeApp(firebaseConfig, "secondary")
  : getApps()?.[1];
const secondaryAuth = getAuth(secondaryApp);
```

Used by `AdminDashboardComponents/Components/HireRider.jsx`:
- `createRiderAuthAccount(email, password)` — calls `createUserWithEmailAndPassword(secondaryAuth, email, password)`
- `deleteRiderAuthAccount(email, password)` — calls `signInWithEmailAndPassword(secondaryAuth, email, password)` then deletes the user
- Does NOT affect the admin's primary auth session

### Password Handling

| Operation | Method | Rule |
|---|---|---|
| Create rider | Firebase Auth Admin API via secondary app | Min 6 chars |
| Update menu/orders/etc | RTDB `.write` rules with `auth.uid` check | Must match `admins/{uid}` record |
| Bot writes | Admin SDK service account | No rule enforcement |
| Reset rider password | `updatePassword(secondaryAuth.currentUser, newPw)` | Requires prior sign-in |

---

## 2. Firebase-Rules

Full rule definitions in `docs/03-foundation/03-Database-Security-Rules.md`. Key RBAC gates:

```json
"admins": {
  "$uid": {
    ".read": "auth.uid === $uid && root.child('admins/'+$uid).child('businessId').exists()",
    ".write": "auth.uid === $uid"
  }
}
```

For orders under `businesses/{bid}/outlets/{oid}/orders/{pushId}`:

```json
"orders": {
  "$orderId": {
    ".read": "auth != null && (data.child('riderId').val() === auth.uid || data.child('uid').val() === auth.uid || root.child('admins/'+auth.uid).child('businessId').val() === $bid)",
    ".write": "auth != null && (data.child('uid').val() === auth.uid || root.child('admins/'+auth.uid).child('businessId').val() === $bid)"
  }
}
```

---

## 3. Database-Structure

All RBAC state lives in:
- `admins/{uid}` — `{ businessId, outletId, isSuper (optional), tfaSecret (optional), password (admin-set) }`
- `system/admins/{uid}/tfaSecret` — TOTP secret for SuperAdmin (backup)
- `riders/{uid}` — `{ name, phone, email, businessId, outletId, wallet, ... }`
- `riders/{uid}/fcmToken` — FCM token for push notifications
- `users/{uid}` — `{ name, phone, fcmToken }`
- `onboarding_requests/{uid}` — pending new-business requests reviewed by SuperAdmin

---

## 4. Connecting-Nodes

```
[Login flow: all non-bot apps]
  1. Firebase Auth sign-in (email+password or Google redirect)
  2. onAuthStateChanged triggers
  3. App reads admins/{auth.uid} (or riders/{auth.uid} or users/{auth.uid})
  4. App renders UI based on role/permissions
  5. All Firebase writes go through rules validation

[SuperAdmin 2FA login]
  1. Sign in with email+password
  2. onAuthStateChanged fires
  3. SuperAdmin reads system/admins/{uid}/tfaSecret
  4. Generates QR code from `otpauth://totp/Foodhubbie:{email}?secret={secret}&issuer=Foodhubbie`
  5. User scans QR with authenticator app (e.g. Google Authenticator)
  6. User enters 6-digit code → verifyTOTP() checks HMAC-SHA1
  7. If valid: set sessionToken, show dashboard
  8. If invalid: reject login, increment otpAttempts counter

[Admin creates rider account]
  1. Admin fills HireRider form (name, email, phone, password)
  2. secondaryAuth.createUserWithEmailAndPassword(email, password)
  3. Writes riders/{newUid}: { name, phone, email, businessId, outletId, wallet: 0, createdAt }
  4. Sign out of secondary auth (admin stays logged into primary)
```

---

## 5. Complete Flow: Onboarding a New Admin

1. SuperAdmin navigates to Onboarding tab → fills form: business name, slug, admin email, etc.
2. Form calls Firebase Auth `createUserWithEmailAndPassword(email, password)`
3. Writes `admins/{newUid}`: `{ businessId, outletId, isSuper: true }`
4. Writes `onboarding_requests/{newUid}`: `{ status: "approved", approvedBy: auth.uid, businessId, outletId }`
5. New admin receives welcome email with credentials
6. New admin logs into SuperAdmin (or Admin Dashboard depending on scope)
7. If business also needs a bot: SuperAdmin runs `seed-bot-routing.js` and provisions PM2 instance
