# Audit — Points

## Key Implementation Details
- Aggregates 4 independent audit paths into single feed
- Concurrent reads via 4 separate Firebase queries
- Pagination at 50 entries per page
- Sorted by timestamp descending after merge

## Known Issues
- No source/type filter — all entries mixed together
- No search functionality
- No date range filter
- No real-time updates (one-time read)
- Detail column truncated (first ~100 chars)
- All 4 reads must succeed for display — single failure blocks all

## Gotchas
- Large audit logs will be slow (all entries loaded client-side)
- No way to identify which admin performed which action (admin field may be empty in some paths)
- Marketplace audit uses userId instead of admin email
- Rider errors path may contain device/stack trace details
- No way to delete individual audit entries (bulk archive/purge only via Settings)
- Cross-path sorting means entries from different sources interleave chronologically
