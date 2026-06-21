# Database Structure: Admin Promotions Module

## Nodes READ
- `bot/{outlet}/promotions/campaigns/` — campaign list + live progress
- `bot/{outlet}/promotions/templates/` — saved message templates
- `bot/{outlet}/promotions/killSwitch` — emergency stop flag
- `bot/{outlet}/promotions/enabled` — master toggle
- `bot/{outlet}/status` — bot online/offline status
- `Outlet('customers')` — recipient source (all customers)
- `Outlet('orders')` — filtered recipient source

## Nodes WRITTEN
- `bot/{outlet}/commands/{cmdId}` — campaign command (push)
- `bot/{outlet}/promotions/campaigns/{id}` — campaign doc (set/push)
- `bot/{outlet}/promotions/templates/{id}` — saved template (push/remove)
- `bot/{outlet}/promotions/killSwitch` — emergency stop (set)
- `bot/{outlet}/promotions/enabled` — master toggle (set)

## Full schema
See `Logic/Bot/Promotions/Database-Structure.md` for complete node definitions.

## Related docs
- `Logic/Bot/Promotions/Database-Structure.md` — bot-side schema
- `Logic/Admin-Dashboard/Discounts/Database-Structure.md` — discount usage records
