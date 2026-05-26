# SuperAdmin — Security Measures

## XSS Prevention — safeText()
```javascript
function safeText(str) {
  const el = document.createElement('div');
  el.textContent = str || '';
  return el.innerHTML;
}
```
- Converts user-controlled strings to DOM-safe HTML
- Used in ALL template literals rendering user data
- Prevents HTML/script injection via name, email, address, etc.

## CSV Injection Prevention — safeCSV()
```javascript
function safeCSV(val) {
  const str = String(val || '');
  if (/^[=+\-@]/.test(str)) return "'" + str;
  return str;
}
```
- Prepends `'` to values starting with `=`, `+`, `-`, or `@`
- Prevents Excel formula execution when CSV is opened
- Used in all export functions (coupons, users, reconciliation, reports)

## Rate Limiting — checkRateLimit()
```javascript
const _rateLimitStore = {};
function checkRateLimit(action, maxRequests = 1, windowMs = 60000) {
  // In-memory rate limit tracking
  // Max 1 request per 60 seconds per action type
  // Returns true if allowed, false if rate limited
}
```
- Actions protected: `SEND_BROADCAST`, `CREATE_COUPON`, `BULK_OPERATION`, `ECOSYSTEM_INITIALIZE`
- Session-only (resets on page refresh)
- Not shared across tabs

## Atomic Write Pattern — atomicAdminAction()
```javascript
function atomicAdminAction(updates, action, details) {
  // 1. Generate push ID for audit log
  // 2. Add audit entry to updates object
  // 3. db.ref().update(updates) — single call
  // 4. Bundles business data + audit log
}
```
- Ensures audit log is always written alongside data mutations
- Single `update()` call is not truly atomic in Firebase, but reduces partial-failure window

## Secondary Auth Instance
```javascript
const secondaryAuth = firebase.initializeApp(firebaseConfig, "SecondaryAuth");
// Used for creating partner/rider accounts
// Prevents secondaryAuth.login() from affecting admin session
```

## Known Security Concerns
| Issue | Severity | Location |
|---|---|---|
| Plaintext passwords in DB | High | `system/admins/{uid}/password`, `businesses/{*}/outlets/{*}/password` |
| 2FA secret stored in RTDB | Medium | `system/admins/{uid}/tfa/secret` |
| Client-side RBAC only | Medium | Tab hiding via CSS/JS — determined user could access tabs via URL |
| In-memory rate limiter | Low | Resets on page refresh; not distributed |
| No CSP headers | Low | Missing Content-Security-Policy in index.html |
| No App Check | Low | Firebase App Check not configured (Spark plan) |
| No input sanitization on forms | Low | Relies on HTML5 validation + safeText() on output |
