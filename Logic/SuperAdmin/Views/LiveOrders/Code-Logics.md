# Live Orders Tab — Code Logics

## Purpose
Real-time order command center with table and Kanban views, SLA monitoring, and status management.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadLiveOrders()` | Tab load / refresh | Attach real-time listener, aggregate all orders |
| `_processAndRenderOrders(businesses)` | Data ready | Normalize, filter, count, route to view renderer |
| `renderOrderTable()` | Table view | Build pipeline table with SLA coloring |
| `renderOrderKanban()` | Kanban view | Build drag-and-drop Kanban columns |
| `filterOrderPipeline(status)` | Pipeline card click | Filter table by status category |
| `setOrderView(view)` | View toggle | Switch table/Kanban (persisted to localStorage) |
| `updateOrderStatus()` | Action dropdown | Change order status via SweetAlert2 |
| `handleOrderDragStart(e)` | Kanban drag start | Store dragged order ID |
| `handleOrderDrop(e, newStatus)` | Kanban drop | Map drop zone → new status → Firebase write |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `on('value')` | Real-time order stream |
| `businesses/{bid}/outlets/{oid}/orders/{id}/status` | Write | Status update |

## Order Pipeline Cards (5)
| Filter | Color | Border |
|---|---|---|
| All | Default | None |
| New / Pending | Orange | `border-left: 3px solid #F97316` |
| Preparing | Blue | `border-left: 3px solid #3B82F6` |
| Out for Delivery | Purple | `border-left: 3px solid #8B5CF6` |
| Delivered | Green | `border-left: 3px solid #10B981` |

## SLA Alert
```
Orders with status "Placed" and age > 30 minutes:
  1. Row gets red styling
  2. #slaAlerts banner shown with count
  3. "X orders are pending for over 30 minutes"
```

## Table View
```
Columns: Order ID | Outlet | Customer | Items | Amount | Status | Age | Rider | Actions
Age: computed from order.createdAt to now
  ├─ Green: < 15min
  ├─ Yellow: 15-30min
  └─ Red: > 30min (SLA breach)
```

## Kanban View
```
Columns (4):
  ├─ New / Pending
  ├─ Preparing
  ├─ Out for Delivery
  └─ Delivered

Each column:
  ├─ Header with count
  └─ Cards draggable between columns
```

## View Toggle Persistence
```javascript
setOrderView(view):
  localStorage.setItem('orderView', view)
  // table → show #orderTableView, hide #orderKanbanView
  // kanban → show #orderKanbanView, hide #orderTableView
```

## Edge Cases
- **No orders** → Pipeline cards show 0, empty table
- **Listener already attached** → `_liveOrdersUnsub()` called before re-attaching
- **SLA breach with no orders** → SLA banner hidden
- **Invalid drag target** → Drop ignored, card returns to original column
- **Outlet filter no matches** → Empty table
