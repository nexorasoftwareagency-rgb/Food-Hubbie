# Firebase Rules: Admin Discounts Module

## Required rules
```json
{
  "rules": {
    "$outletId": {
      "discounts": {
        ".read": "auth != null && (auth.token.admin === true || auth.token.superadmin === true)",
        ".write": "auth != null && (auth.token.admin === true || auth.token.superadmin === true)"
      },
      "discountsUsage": {
        ".read": "auth != null && (auth.token.admin === true || auth.token.superadmin === true)",
        ".write": "auth != null"
      }
    }
  }
}
```

## Note
Bot uses `firebase-admin` (bypasses rules). These rules protect against unauthenticated client-side access.

## Related rules
- `Logic/Bot/Discount-Engine/Firebase-Rules.md` — bot-side rules
- `docs/03-foundation/03-Database-Security-Rules.md` — full rule set
