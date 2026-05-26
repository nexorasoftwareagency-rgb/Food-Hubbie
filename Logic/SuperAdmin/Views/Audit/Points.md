# Audit Tab — Important Points

1. **4 parallel reads**: `loadAuditLogs()` fires 4 `once('value')` calls simultaneously
2. **Source badge**: Each log row has a colored badge identifying the source system
3. **Monospace styling**: Audit table uses `.font-mono` class for technical feel
4. **Metadata truncation**: Long `details` strings truncated with CSS `text-overflow: ellipsis`
5. **No log mutation**: Read-only — admin cannot delete or modify audit entries
6. **Missing path tolerance**: If a log path doesn't exist, the query returns null silently
7. **Audit log rotation**: Data retention policies can archive/purge old logs from Infrastructure tab
