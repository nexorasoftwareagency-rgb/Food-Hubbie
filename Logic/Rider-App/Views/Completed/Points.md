# Completed View — Important Points

1. **Ledger as source of truth**: Rider's completed trips read from ledger, not orders query
2. **Timestamp comparison**: Date filters compare `entry.timestamp` with computed start boundaries in IST
3. **Order detail modal**: Only loads order detail on-demand (when card tapped) to minimize reads
4. **Missing order data**: If the original order node was deleted, show "Order details unavailable" with basic info from ledger
5. **Load limit**: 50 entries initial, "Load More" button for next 50, no infinite scroll
6. **Search field**: Filters both customerName and orderId (case-insensitive `includes()`)
7. **Empty state**: "🚚 No completed deliveries yet" with illustration (CSS-based)
8. **Currency format**: All amounts shown with ₹ prefix using `window.formatCurrency()`
9. **Pull-to-refresh**: Mobile drag gesture re-fetches ledger data
10. **No real-time listener**: Unlike other views, completed is read-once + manual refresh
