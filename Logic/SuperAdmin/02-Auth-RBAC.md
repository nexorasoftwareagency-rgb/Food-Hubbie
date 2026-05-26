# SuperAdmin — Auth & RBAC

## Authentication Flow
```
1. Login page (#loginOverlay) shown on page load
2. Admin enters email + password → doLogin()
3. Firebase auth.signInWithEmailAndPassword(email, password)
4. On success → checkAuth() fires onAuthStateChanged
5. checkAuth():
   a. Read system/admins/{uid} from RTDB
   b. If DB record missing → fallback to custom claims (token.claims.superadmin)
   c. Verify admin.isActive !== false
   d. If admin.tfa.enabled → show #tfaModal (2FA required)
   e. Hide login overlay → show #mainContainer
   f. Set window.currentAdminRole and window.currentAdminData
   g. Apply RBAC restrictions → applyRBACRestrictions(role)
   h. Load dashboard data → initStats()
6. 2FA required:
   a. #tfaModal shown after password auth
   b. Admin enters 6-digit TOTP code
   c. submitTFACode() → verifyTFACode(code)
   d. Verifies against stored TFA secret using OTPAuth library
   e. On success → hide modal, proceed to main app
   f. On failure → show error, max 3 attempts before silent redirect
```

## Firebase Instances
```javascript
// Primary — admin session
firebase.initializeApp(firebaseConfig);

// Secondary — for creating partner/rider accounts
// Prevents secondaryAuth sign-in from disrupting the admin session
firebase.initializeApp(firebaseConfig, "SecondaryAuth");
```

## RBAC — Role-Based Access Control

### Roles (5)
| Role | Level | Description |
|---|---|---|
| `superadmin` | Root | All 17 tabs + all operations |
| `admin` | Root | All 17 tabs + all operations |
| `business` | Partner | 10 tabs + business/riders/promotions/orders/users |
| `outlet` | Outlet | 3 tabs: orders + reviews |
| `support` | Customer Support | 4 tabs: users + reviews + broadcast |

### Tab Access by Role
| Tab | superadmin | admin | business | outlet | support |
|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Onboarding | ✓ | ✓ | ✓ | ✗ | ✗ |
| Reconciliation | ✓ | ✓ | ✗ | ✗ | ✗ |
| Businesses | ✓ | ✓ | ✓ | ✗ | ✗ |
| Outlets | ✓ | ✓ | ✓ | ✗ | ✗ |
| Analytics | ✓ | ✓ | ✗ | ✗ | ✗ |
| Riders | ✓ | ✓ | ✓ | ✗ | ✗ |
| Delivery | ✓ | ✓ | ✗ | ✗ | ✗ |
| Inventory | ✓ | ✓ | ✗ | ✗ | ✗ |
| Promotions | ✓ | ✓ | ✓ | ✗ | ✗ |
| Users | ✓ | ✓ | ✓ | ✗ | ✓ |
| Live Orders | ✓ | ✓ | ✓ | ✓ | ✗ |
| Reviews | ✓ | ✓ | ✓ | ✓ | ✓ |
| Broadcast | ✓ | ✓ | ✗ | ✗ | ✓ |
| Audit | ✓ | ✓ | ✗ | ✗ | ✗ |
| Reports | ✓ | ✓ | ✗ | ✗ | ✗ |
| Settings | ✓ | ✓ | ✗ | ✗ | ✗ |

### Operations by Role
```javascript
RBAC_PERMISSIONS = {
  superadmin: ['all'],
  admin: ['all'],
  business: ['manage_businesses', 'manage_riders', 'manage_promotions', 'view_orders', 'view_users'],
  outlet: ['view_orders', 'view_reviews'],
  support: ['view_users', 'view_reviews', 'send_broadcast']
}
```

### Implementation
```javascript
function applyRBACRestrictions(role) {
  // 1. Hide tabs the role cannot access (nav-links with no data-tab access)
  // 2. Hide sensitive controls (delete buttons, admin features)
  // 3. Show role badge in sidebar
  // 4. Update header title
}

function hasPermission(operation) {
  const perms = RBAC_PERMISSIONS[currentAdminRole] || [];
  return perms.includes('all') || perms.includes(operation);
}

function hasTabAccess(tabName) {
  // Returns boolean if current role can view this tab
}
```

## 2FA (TOTP) Flow
```
1. Admin navigates to Infrastructure tab
2. loadTFAStatus() reads system/admins/{uid}/tfa
3. If TFA not enabled → show Enable 2FA button
4. If TFA enabled → show Disable 2FA button + status
5. Enable flow:
   a. showTFASetup(): generates OTPAuth secret, creates QR code via qrcodejs
   b. Admin scans QR with authenticator app (Google Authenticator, Authy)
   c. Admin enters 6-digit code from app
   d. verifyTFASetup(): validates code against temp secret
   e. On success: saves { enabled: true, secret } to system/admins/{uid}/tfa
6. Disable flow:
   a. disableTFA(): removes tfa data from DB
   b. 2FA no longer required at login
```

## Security Notes
| Concern | Mitigation |
|---|---|
| Session hijacking | Firebase Auth auto-refresh |
| Brute force login | Firebase Auth built-in rate limiting |
| Unauthorized tab access | applyRBACRestrictions() hides DOM elements (client-side only) |
| Account creation | Secondary Firebase instance prevents session disruption |
| 2FA secret storage | Stored in RTDB system/admins/{uid}/tfa (server-accessible) |
| Admin passwords | Stored in plaintext at system/admins/{uid}/password (known concern) |
| Suspended accounts | isActive flag checked at login |
