# Search Page — Points

- Only searches outlets/dishes already loaded in memory — not incremental
- No debounce timeout risk (fast typers may see stale results briefly)
- Special characters in query are passed through as-is to `.includes()` filters
