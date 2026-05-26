## Points.md

- No validation on `shopOpenTime`/`shopCloseTime` format — free text input for time
- `deliveryFee` field in OrdersPage display references `o.deliveryFee` — but Settings stores delivery slabs, not a single fee
- Backup code is 4-digit string — used by bot for admin verification; no validation on save
- No character limits on text fields — could accept very long values
- Display tab is placeholder — no functionality yet
- Store address not auto-populated to outletInfo — must be entered separately in settings and admin profile
