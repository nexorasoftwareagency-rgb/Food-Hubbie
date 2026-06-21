# Firebase Rules: AnalyticsPage

## Required rules for Analytics to work

```json
{
  "rules": {
    "outlets": {
      "$outletId": {
        "orders": {
          ".read": "auth != null && (
            root.child('admins').child(auth.uid).child('outlets').child($outletId).exists() ||
            root.child('admins').child(auth.uid).child('role').val() === 'superadmin'
          )",
          ".indexOn": ["createdAt", "status"]
        },
        "dishes": {
          ".read": "auth != null && root.child('admins').child(auth.uid).child('outlets').child($outletId).exists()"
        }
      }
    },
    "riders": {
      ".read": "auth != null && root.child('admins').child(auth.uid).child('role').val() in ['superadmin', 'admin']"
    }
  }
}
```

## Why each rule
- **orders read** — admin must be assigned to the outlet OR be a superadmin
- **orders indexOn `createdAt`** — speeds up future server-side date filtering
- **orders indexOn `status`** — speeds up cancellation count
- **dishes read** — same outlet-scoped admin check
- **riders read** — admin or superadmin only (riders can't see Analytics)

## No writes
Analytics page performs zero write operations. No `.write` rule is needed for this page.

## Privacy notes
- Customer phone numbers are read by `aggregateByCustomer` and rendered in the top-customers list. The phone field is treated as PII — only admins with outlet access can see it.
- If you want to hide phones from non-owner admins, add a `.validate` rule or strip the field client-side based on the actor's role.

## Related rules
- `docs/03-foundation/03-Database-Security-Rules.md` — full rule set
- `Logic/Admin-Dashboard/Orders/Firebase-Rules.md` — orders write rules
