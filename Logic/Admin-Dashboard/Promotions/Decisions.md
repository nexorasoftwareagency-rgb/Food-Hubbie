# Decisions: Admin Promotions Module

## Why 972 lines for promotions.js?
The module handles: composer UI, recipient picker (4 sources), CSV import with column auto-detect, image preview, campaign launcher, live progress subscriber, kill-switch toggle, bot status monitor, campaign history, clone, CSV export, and template management. It's a full-featured campaign management system.

## Why `onValue` for live progress?
Real-time progress bar requires persistent listener. Detach on tab switch to stay under 50K Spark reads/day. Same pattern as `cleanupRiders()`.

## Why dashboard-level enable toggle?
Allows disabling all promotions without editing individual campaigns. Bot checks `promotions/enabled` before processing any `SEND_PROMOTION` command.

## CSV column auto-detection
`PHONE_HINTS = ['whatsapp', 'phone', 'mobile', 'number', 'cell', 'contact', 'tel', 'msisdn']` — matches common column names. Falls back to first column with most 10-digit values.

## Campaign clone (not edit)
Campaigns are immutable once started. Clone creates a new doc with `status="draft"` and `currentIndex: 0`. Original logs preserved.

## Why bypass `appendContactInfo`?
Promotional messages need a clean footer ("Reply STOP to unsubscribe") instead of the admin contact footer. `sendPromotionalMessage()` handles this.
