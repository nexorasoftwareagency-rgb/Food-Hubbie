# Promotions Tab — Important Points

1. **Rate limit scope**: In-memory only — resets on page refresh, not shared across tabs
2. **Coupon code as key**: Coupon `code` is the Firebase key — must be unique, no spaces
3. **SafeCSV for export**: All values wrapped with `safeCSV()` to prevent Excel formula injection
4. **Surge multiplier validation**: Rule enforces `>= 1.0` at DB level, HTML5 `min="0"` at input level
5. **Bulk pause**: `bulkOperation('pause')` sets all coupons `active = false` — no resume-all, only individual toggle
6. **Coupon deletion**: `deleteCoupon()` removes the entire coupon node (no soft-delete)
7. **Platform fee**: Stored under `system/config` (not `system/promotions`), despite being shown in Promotions tab
