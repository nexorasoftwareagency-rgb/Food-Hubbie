# Live Orders Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Live Orders" tab
2. loadLiveOrders() called:
   ├─ If _liveOrdersUnsub exists → call it (detach previous listener)
   ├─ db.ref('businesses').on('value', (snap) => {
   │   ├─ allLiveOrders = _processAndRenderOrders(businesses)
   │   ├─ Filter: 48h window, active statuses
   │   ├─ Update pipeline metric cards
   │   ├─ Check SLA breaches → render #slaAlerts
   │   ├─ Get localStorage('orderView') → default "table"
   │   ├─ If "table" → renderOrderTable()
   │   ├─ If "kanban" → renderOrderKanban()
   │   └─ lucide.createIcons()
   │   })
   └─ _liveOrdersUnsub = detach function for this listener
```

## Table View Flow
```
1. Order table rendered with all columns
2. Admin reviews orders
3. Admin can:
   ├─ Click pipeline card to filter by status
   ├─ Change outlet filter dropdown
   ├─ Tap "Actions" → "Update Status" → select new status → SweetAlert2 confirm
   └─ Tap "Refresh" to reload
```

## Kanban View Flow
```
1. 4 columns rendered
2. Admin drags order card:
   ├─ dragstart: store order data
   ├─ dragover: prevent default (allow drop)
   └─ drop: handleOrderDrop(e, newStatus):
       ├─ Map drop zone column to status value
       ├─ db.ref('orders/{id}/status').set(newStatus)
       ├─ logAdminAction('ORDER_STATUS_UPDATED', { orderId, oldStatus, newStatus })
       └─ Kanban auto-refreshes via real-time listener
```

## Toggle View Flow
```
1. Admin taps "Kanban" button in view toggle
2. setOrderView('kanban'):
   ├─ localStorage.setItem('orderView', 'kanban')
   ├─ Hide #orderTableView
   ├─ Show #orderKanbanView
   └─ renderOrderKanban()
```
