# Onboarding Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `onboarding_requests` | `on('value')`, `once('value')` | Real-time request monitoring |
| `onboarding_requests/{uid}` | `remove()` | Reject/cleanup |
| `onboarding_history/{uid}` | `set()` | Archival after approval |
| `businesses/{bid}` | `set()` | Create new business |
| `businesses/{bid}/outlets/{oid}` | `set()` | Create new outlet |
| `businesses/{bid}/outlets/{oid}/categories` | `set()` | Default categories |
| `system/admins/{uid}` | `set()` | Create admin account |
| `slugs/outlets/{slug}` | `set()` | Register slug |
| `system/auditLogs` | `push()` | Audit log |

## Secondary Auth Instance
```javascript
const secondaryAuth = firebase.initializeApp(firebaseConfig, "SecondaryAuth");
// Used for: secondaryAuth.auth().createUserWithEmailAndPassword(email, password)
// Prevents admin session disruption
```

## Rules Notes
- All paths require admin authentication
- No public write access to `onboarding_requests` (submitted via partner-facing app with different auth)
- Slug uniqueness enforced at application level (no DB constraint)
