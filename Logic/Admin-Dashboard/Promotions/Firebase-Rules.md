# Firebase Rules: Admin Promotions Module

## Required rules
```json
{
  "rules": {
    "bot": {
      "$outletId": {
        "promotions": {
          ".read": "auth != null && (auth.token.admin === true || auth.token.superadmin === true)",
          ".write": "auth != null && (auth.token.admin === true || auth.token.superadmin === true)"
        },
        "commands": {
          ".read": "auth != null",
          ".write": "auth != null && (auth.token.admin === true || auth.token.superadmin === true)"
        }
      }
    }
  }
}
```

## Note
The existing `bot` rule in `database.rules.json` already covers `bot/{outlet}/promotions/*`. These rules are explicit for clarity.

## Related rules
- `Logic/Bot/Promotions/Firebase-Rules.md` — bot-side rules
- `docs/03-foundation/03-Database-Security-Rules.md` — full rule set
