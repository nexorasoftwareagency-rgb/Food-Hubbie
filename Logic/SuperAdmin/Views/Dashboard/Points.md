# Dashboard Tab — Important Points

1. **Real-time listener**: Uses `on('value')` on `businesses` — continuous updates without polling
2. **Order date filtering**: `order.timestamp` compared against start of today (admin's local time, not IST)
3. **SVG sparkline**: Inline `<svg>` with polyline path — no library needed
4. **Heatmap opacity**: Cell background alpha = `(count / maxCount) * 0.8 + 0.1` for visibility
5. **Business table columns**: Admin email looked up from separate `system/admins` path (not denormalized)
6. **Empty states**: All containers show fallback text if no data
7. **Performance**: Large number of businesses/orders could slow initial render (all loaded client-side)
8. **Firebase cost**: `on('value')` reads the entire `businesses` tree on every change
