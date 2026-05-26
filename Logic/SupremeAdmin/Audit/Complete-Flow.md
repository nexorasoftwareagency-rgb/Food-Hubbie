# Audit — Complete Flow

## User Journey
1. Admin clicks Audit tab → initAudit() fires
2. 4 concurrent reads initiated:
   - /system/auditLogs
   - /logs/marketplaceAudit
   - /logs/botAudit
   - /logs/riderErrors
3. All data merged, sorted by timestamp desc, paginated (50/page)
4. Table renders: Action, Details, Admin/Source, Timestamp
5. Admin can:
   a. **Navigate pages**: Click pagination to browse
   b. **Read details**: Scan the truncated detail column
6. No search, filter, or export available

## Data Flow
4x Firebase once('value') → Promise.all() →
  mergeEntries() → addTypeMetadata() → sortByTimestampDesc() →
  renderAuditPage(1) → renderPagination()
