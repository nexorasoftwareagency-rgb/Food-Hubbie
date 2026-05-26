# SuperAdmin — Live Orders Engine

## Overview
Real-time order command center with dual-view (table/kanban), SLA monitoring, and drag-and-drop status management.

## Architecture
```
businesses (on 'value')
  → _processAndRenderOrders()
    → renderOrderTable() OR renderOrderKanban()
    → filterOrderPipeline(status) for filtering
    → updateOrderStatus() for manual updates
```

## Real-time Listener
```javascript
// Attached on tab load, detached on tab switch
db.ref('businesses').on('value', (snap) => {
  // Full tree read on every change
  _processAndRenderOrders(snap.val());
});

// Detach handler stored for cleanup:
_liveOrdersUnsub = () => db.ref('businesses').off('value');
```

## Data Processing
```javascript
_processAndRenderOrders(businesses):
  1. Flatten: allBusinesses → outlets → orders
  2. Filter: within 48h window AND active status
  3. Sort: newest first
  4. Count by pipeline status
  5. Update metric cards
  6. Check SLA breaches (status "Placed" + age > 30min)
  7. Route to table or kanban renderer based on localStorage('orderView')
```

## SLA Monitoring
```javascript
// Hardcoded 30-minute threshold
const SLA_THRESHOLD_MS = 30 * 60 * 1000;

// Applied per order:
if (order.status === 'Placed' && (Date.now() - order.createdAt > SLA_THRESHOLD_MS)) {
  // Red row styling
  // Add to SLA alerts banner
}
```

## Kanban Drag-and-Drop
```javascript
// HTML5 native DnD API
handleOrderDragStart(e):      // Store dragged order ID in dataTransfer
handleOrderDrop(e, newStatus): // Read order ID, map drop column to status,
                                // write to Firebase, refresh kanban
```

## Column → Status Mapping
| Column | Status Value |
|---|---|
| New / Pending | `Placed`, `Confirmed` |
| Preparing | `Preparing` |
| Out for Delivery | `Out for Delivery`, `Reached Drop Location` |
| Delivered | `Delivered` |

## Status Update Flow
```javascript
updateOrderStatus():
  1. Read current order data
  2. Show SweetAlert2 with dropdown of valid next statuses
  3. On confirm: db.ref('orders/{id}/status').set(newStatus)
  4. logAdminAction('ORDER_STATUS_UPDATED', { orderId, oldStatus, newStatus })
  5. Table/kanban auto-updates via real-time listener
```

## View Toggle
```javascript
setOrderView(view): // 'table' | 'kanban'
  localStorage.setItem('orderView', view);
  // Toggle visibility of #orderTableView and #orderKanbanView
  // Render appropriate view
```

## Filter System
| Filter | Type | Behavior |
|---|---|---|
| Pipeline status | Clickable cards | `filterOrderPipeline('new')` — filter table rows |
| Outlet | Dropdown | `loadLiveOrders()` re-queries with filter |
| View | Toggle | Switch between table/kanban |

## Performance Considerations
- Full `businesses` tree read on every change — expensive for large ecosystems
- 48h window filter limits orders processed
- Real-time listener re-attached on every tab switch (with cleanup)
- Kanban render creates many DOM elements — could be slow with 100+ orders
