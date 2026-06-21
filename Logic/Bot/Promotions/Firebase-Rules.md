# Firebase Rules: Bot Promotions Module

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

## Why each rule
- **promotions read/write** — admin manages campaigns, bot reads commands and writes logs. Bot uses `firebase-admin` (bypasses rules).
- **commands read** — bot needs to read commands. Admin writes commands via `push()`.
- **commands write** — admin-only (bot never writes commands, only reads them).

## Note
The existing `bot` rule already covers `bot/{outlet}/promotions/*` sub-nodes. These rules are explicit for clarity. The bot's `firebase-admin` SDK bypasses all rules.

## Related rules
- `docs/03-foundation/03-Database-Security-Rules.md` — full rule set
