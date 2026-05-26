# Points / Gotchas: InventoryPage

- **No Firebase integration** — data resets on every page refresh
- **Stock bar uses threshold as 100%** — comparison is against threshold, not absolute max stock
- **No negative stock** — `Math.max(0, ...)` prevents going below zero
- **No audit log** — stock changes are untracked
- **No reorder/alert** — only visual status badge indicates problems
- **Export CSV headers**: item, stock, threshold, status, unit
