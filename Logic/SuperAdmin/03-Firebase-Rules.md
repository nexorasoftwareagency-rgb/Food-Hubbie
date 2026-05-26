# SuperAdmin — Firebase Rules

## Authentication
- Firebase Auth (Email/Password) via compat SDK v9.6.1
- Role stored in `system/admins/{uid}/role` + `system/admins/{uid}/isSuper` boolean
- Custom claims fallback: `token.claims.superadmin` if DB record missing
- Secondary auth instance for account creation (prevents session disruption)

## Path Access Matrix

### System Admin
| Path | Operation | Purpose |
|---|---|---|
| `system/admins/{uid}` | Read/Write | Profile, role, 2FA, password |
| `system/admins` | Read (once) | Business admin lookup |
| `system/auditLogs` | Write (push), Read | Audit logging, reports |

### Onboarding
| Path | Operation | Purpose |
|---|---|---|
| `onboarding_requests` | Read (on), Write | Partner request management |
| `onboarding_history/{uid}` | Write | Archival after approval |

### Businesses & Outlets
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | Read (on, once) | All business data |
| `businesses/{bid}` | Write | Business updates |
| `businesses/{bid}/outlets/{oid}` | Read/Write | Outlet CRUD |
| `businesses/{bid}/outlets/{oid}/orders` | Read/Write | Order management |
| `businesses/{bid}/outlets/{oid}/settlements` | Read/Write | Financial reconciliation |
| `businesses/{bid}/outlets/{oid}/wallet` | Transaction | Settlement payout |
| `businesses/{bid}/outlets/{oid}/ledger/{txId}` | Write | Ledger entry |
| `businesses/{bid}/outlets/{oid}/dishes/{dishId}` | Read/Write | Inventory control |
| `businesses/{bid}/outlets/{oid}/reviews` | Read | Reviews aggregation |
| `slugs/outlets/{slug}` | Write | Slug registry |

### System Config
| Path | Operation | Purpose |
|---|---|---|
| `system/settings/delivery` | Read/Write | Delivery fee mode + rates |
| `system/settings/delivery/mode` | Write | Mode toggle |
| `system/promotions/surge` | Write | Surge pricing |
| `system/promotions/globalDiscount` | Write | Global discount |
| `system/promotions/coupons/{code}` | Read/Write | Coupon CRUD |
| `system/config/platformFee` | Write | Platform fee |
| `system/broadcasts/{key}` | Write, Read | Broadcast center |
| `system/settlements` | Read | Data retention |

### Users
| Path | Operation | Purpose |
|---|---|---|
| `users` | Read (on, once) | User registry |
| `users/{uid}` | Read | User profile |
| `users/{uid}/walletBalance` | Transaction | Wallet credit |
| `users/{uid}/walletHistory/{txId}` | Write | Credit history |

### Riders
| Path | Operation | Purpose |
|---|---|---|
| `riders` | Read (on, once), Write | Rider management |
| `riders/{uid}` | Write | Rider CRUD |
| `riders/{uid}/photoURL` | Write | Photo upload |
| `riders/{uid}/aadharImage` | Write | KYC upload |

### Logs (Read-only)
| Path | Operation | Purpose |
|---|---|---|
| `logs/marketplaceAudit` | Read | Audit console |
| `logs/botAudit` | Read | Audit console |
| `logs/riderErrors` | Read | Audit console |

### Archives
| Path | Operation | Purpose |
|---|---|---|
| `archives/orders/{bid}/{oid}/{year}/{month}/{orderId}` | Write | Order archival |
| `archives/auditLogs/{year}/{month}/{id}` | Write | Audit log archival |
| `archives/marketplaceAudit/{year}/{month}/{id}` | Write | Marketplace audit archival |
| `archives/botAudit/{year}/{month}/{id}` | Write | Bot audit archival |
| `archives/settlements/{year}/{month}/{id}` | Write | Settlement archival |

## Security Rules Approach
- **No client-side security rules defined** — SuperAdmin relies on Firebase Auth + server-side validation
- All paths are accessed with admin credentials
- `transaction()` used for wallet operations (race condition safety)
- `atomicAdminAction()` bundles business data writes + audit log in single multi-path update

## Validation Rules (Required)
```json
{
  "rules": {
    "onboarding_requests": {
      ".validate": "newData.hasChildren(['name', 'email', 'phone', 'businessName'])"
    },
    "system": {
      "admins": {
        "$uid": {
          "role": { ".validate": "newData.val() in ['superadmin', 'admin', 'business', 'outlet', 'support']" },
          "isActive": { ".validate": "newData.isBoolean()" }
        }
      },
      "promotions": {
        "surge": {
          "multiplier": { ".validate": "newData.isNumber() && newData.val() >= 1.0" }
        },
        "coupons": {
          "$code": {
            "discountValue": { ".validate": "newData.isNumber() && newData.val() > 0" },
            "type": { ".validate": "newData.val() in ['percent', 'fixed']" }
          }
        }
      }
    },
    "users": {
      "$uid": {
        "walletBalance": { ".validate": "newData.isNumber() && newData.val() >= 0" }
      }
    }
  }
}
```
