# Promotions Tab — Firebase Rules

## Paths Accessed
| Path | Operation | Purpose |
|---|---|---|
| `system/promotions/surge` | Read, Write | Surge multiplier |
| `system/promotions/globalDiscount` | Read, Write | Discount config |
| `system/promotions/coupons/{code}` | Read, Write | Coupon CRUD |
| `system/config/platformFee` | Read, Write | Platform fee |
| `system/auditLogs` | Push | Audit log |

## Rules
```json
{
  "rules": {
    "system": {
      "promotions": {
        ".read": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business']",
        ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin', 'business']",
        "surge": {
          "multiplier": { ".validate": "newData.isNumber() && newData.val() >= 1.0" }
        },
        "coupons": {
          "$code": {
            "discountValue": { ".validate": "newData.isNumber() && newData.val() > 0" },
            "type": { ".validate": "newData.val() in ['percent', 'fixed']" },
            "active": { ".validate": "newData.isBoolean()" }
          }
        }
      },
      "config": {
        "platformFee": {
          ".read": "auth != null",
          ".write": "auth != null && root.child('system/admins/'+auth.uid+'/role').val() in ['superadmin', 'admin']"
        }
      }
    }
  }
}
```

## Notes
- Promotions accessible to superadmin/admin/business roles
- Platform fee write restricted to superadmin/admin
- Surge multiplier validated >= 1.0 at DB level
