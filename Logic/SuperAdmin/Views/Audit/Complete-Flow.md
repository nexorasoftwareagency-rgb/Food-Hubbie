# Audit Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Security Audit" tab
2. loadAuditLogs() called:
   ├─ Parallel reads:
   │   ├─ db.ref('system/auditLogs').once('value')
   │   ├─ db.ref('logs/marketplaceAudit').once('value')
   │   ├─ db.ref('logs/botAudit').once('value')
   │   └─ db.ref('logs/riderErrors').once('value')
   ├─ Merge all into allAuditLogs[] with source tag
   ├─ Sort by timestamp descending
   ├─ PAGINATION.audit.total = count
   ├─ Apply source filter (if not "all")
   ├─ renderUnifiedLogs(filtered, page 1)
   └─ lucide.createIcons()
```

## Filter Flow
```
1. Admin selects source filter from #auditLogFilter
2. loadAuditLogs() re-called → filtered by source
```

## Navigation Flow
```
1. Admin clicks pagination page numbers
2. Logs re-rendered for selected page
3. renderPagination() updates controls
```
