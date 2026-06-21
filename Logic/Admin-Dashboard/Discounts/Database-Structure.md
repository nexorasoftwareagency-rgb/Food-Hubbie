# Database Structure: Admin Discounts Module

## Nodes READ/WRITE

### `{OUTLET}/discounts/`
Full CRUD from Admin UI. See `Logic/Bot/Discount-Engine/Database-Structure.md` for complete schema.

### `{OUTLET}/discountsUsage/`
Read-only in Admin (bot writes usage records). Used by `discountsReports.js` for analytics.

### `customers/{phone}`
Read for firstOrder eligibility check. Write `firstOrderDiscountUsed` after first-order discount consumed.

### `orders/{orderId}`
Write `discountSource`, `discountId`, `discountLabel` during checkout.

## Related docs
- `Logic/Bot/Discount-Engine/Database-Structure.md` — bot-side schema
- `docs/04-management/04-Business-Rules.md` — platform-level coupon system
