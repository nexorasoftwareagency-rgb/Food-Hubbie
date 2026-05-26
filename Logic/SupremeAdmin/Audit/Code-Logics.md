# Audit — Code Logics

## Initialization
- initAudit() sets up one-time reads from 4 audit paths:
  1. /system/auditLogs — SupremeAdmin actions (settlements, business creation, etc.)
  2. /logs/marketplaceAudit — Marketplace user actions
  3. /logs/botAudit — Bot automation actions
  4. /logs/riderErrors — Rider app error logs

## Data Aggregation
1. Reads all 4 paths concurrently (not sequentially)
2. Merges all entries into a single array
3. Adds metadata: source path (type field for display)
4. Sorts by timestamp descending (newest first)
5. Stores in global auditData array

## Pagination
- renderAuditPage(page): 50 entries per page
- currentAuditPage tracks page state
- renderPagination() for navigation controls

## Table
- Columns: Action, Details, Admin/Source, Timestamp
- Details column shows first ~100 characters of the detail string

## Entry Types
- system/auditLogs → type: "system"
- logs/marketplaceAudit → type: "marketplace"
- logs/botAudit → type: "bot"
- logs/riderErrors → type: "rider"

## No Filters
- No search functionality
- No filter by source/type
- No date range filter
- All entries shown together chronologically

## Data Shape
```json
{
  "action": "Order Settled",
  "details": "Settled order FH-... for outlet...",
  "admin": "admin@email.com",
  "timestamp": 1717000000000,
  "type": "system"
}
```
