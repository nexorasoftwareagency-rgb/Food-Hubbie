# Live Orders — Decisions

1. **Single-page table + Kanban**: Both views render the same data differently. Table for detailed view, Kanban for pipeline view.

2. **Native HTML5 drag-drop**: Chose native drag/drop API over libraries like SortableJS or dnd-kit. Simpler dependency but less feature-rich.

3. **Reads all orders from all businesses**: No server-side filtering by status or date. Entire orders tree loaded and filtered client-side.

4. **Status update writes to order directly**: updateOrderStatus() writes to the order's status field directly. No secondary triggers (notifications, audit logs) from admin side.

5. **No order details modal**: Unlike admin dashboard which has detailed order view, Live Orders only shows table row data. No modal for full order breakdown.

6. **No real-time updates**: Unlike Dashboard, Live Orders does a one-time read (not a listener) — requires manual refresh to see new orders.

7. **View toggle and status filter broken**: Most likely abandoned before completion. The toggle/filter classes were planned but never implemented in HTML.
