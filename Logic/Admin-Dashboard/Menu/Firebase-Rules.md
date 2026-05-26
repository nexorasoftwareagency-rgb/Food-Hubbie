## Firebase-Rules.md

- `dishes/{dishId}` — CRUD by admin
- `categories/{catId}` — read by admin
- Stock auto-migration writes `{stock:0, threshold:5}` — ensure write rules allow this
