# Broadcast — Points

## Key Implementation Details
- Rate limiting is entirely client-side (no server enforcement)
- 5 second minimum interval between broadcasts
- 5 broadcasts per minute maximum
- Form cleared after successful send

## Known Issues
- Rate limiting can be bypassed by calling Firebase directly
- No character count or message preview
- No broadcast templates or drafts
- No push notification integration — broadcasts are stored but not delivered to devices
- No sent/delivered read receipts
- No scheduled/delayed broadcast support

## Gotchas
- "audience" field is metadata only — no actual routing logic
- Broadcast history shows last 50 entries (not all time)
- No delete button for sent broadcasts
- No broadcast analytics (how many users saw it)
- No confirmation dialog before sending
- Rate limit counters reset on page refresh (browser-based)
