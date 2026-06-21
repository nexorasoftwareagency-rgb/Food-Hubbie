# Firebase Rules: Bot Discount Engine

## Required rules for bot discount reads/writes

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

## Why each rule
- **discounts read** — bot needs to evaluate discounts at checkout (via firebase-admin, bypasses rules)
- **discounts write** — admin CRUD only (bot never writes discount definitions)
- **discountsUsage read** — admin reports + analytics
- **discountsUsage write** — bot writes usage records after successful orders (auth != null for bot's service account)

## Note
The bot uses `firebase-admin` SDK which bypasses all RTDB rules. These rules protect the data from unauthenticated client-side access (e.g. if someone inspects the Admin JS bundle).

## Related rules
- `docs/03-foundation/03-Database-Security-Rules.md` — full rule set
- `Logic/Admin-Dashboard/Discounts/Firebase-Rules.md` — Admin-side rules
