# Audit — Decisions

1. **Aggregates 4 separate audit paths**: Audit logs are stored in separate paths per subsystem. Aggregation happens client-side. This allows independent logging but requires 4 reads to get a complete picture.

2. **One-time reads (not listeners)**: Audit data is loaded once and not updated in real-time. Acceptable since audit is historical by nature.

3. **50 items per page**: Larger page size than other tabs (20 per page for businesses/riders/users). Audit logs are compact rows so more per page makes sense.

4. **No source filter**: All 4 log sources are merged into a single feed with no way to filter by source. Admin must scan the "type" column.

5. **Concurrent reads**: Uses 4 Firebase queries concurrently (Promise.all pattern). Efficient but all 4 must complete before display.

6. **No audit log deletion**: Audit logs are immutable from this interface. They can only be archived/purged from the Settings → Data Retention tab.
