# Points / Gotchas: NotificationsPage

- **No actual push notifications** — pure UI mock
- **History lost on page refresh** — local state only
- **No notification templates or scheduling**
- **Recipient count is random** — `Math.floor(Math.random() * 490 + 10)` — fake metric
- **No error handling or validation** on send (e.g., empty title/body allowed)
- **Audience options**: "all", "customers", "riders", "partners", "staff"
