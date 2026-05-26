# Live Orders — Complete Flow

## User Journey
1. Admin clicks Live Orders tab → initLiveOrders() reads all orders across all businesses
2. Orders displayed in table (newest first)
3. Admin can:
   a. **Toggle View**: Switch between Table and Kanban views
   b. **Filter by Status**: Click status filter buttons
   c. **Update Status**: Change order status from dropdown
   d. **Kanban Drag-Drop**: Drag orders between status columns

## Status Update Flow
Status dropdown change → updateOrderStatus(bid, oid, orderId, newStatus) →
  writes /businesses/{bid}/outlets/{oid}/orders/{orderId}/status = newStatus →
  UI needs refresh to reflect change (no real-time listener)

## If Fixed — Kanban Drop Flow
Drag order card → drop on target column →
  reads column's data-status attribute →
  updateOrderStatus(..., targetStatus)
