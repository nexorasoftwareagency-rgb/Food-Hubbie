# Reviews — Points

## Key Implementation Details
- Read-only tab — no moderation capability
- One-time read (once), not real-time listener
- Star rating rendered via Unicode characters (★/☆)
- Comment truncated to 100 characters with "..."
- Sorted newest first

## Known Issues
- No delete/reply/moderation actions
- No pagination — all reviews loaded at once
- No filter by business, rating, or date range
- No search functionality
- No "read more" for truncated comments
- No image display (if reviews had images)

## Gotchas
- Truncated comments may cut off important details
- No way to identify fake or abusive reviews
- No review analytics (average rating per business/outlet)
- Timestamp display uses relative time (timeAgo()) — context lost after 30 days
- Reviews across all businesses mixed together — no grouping
