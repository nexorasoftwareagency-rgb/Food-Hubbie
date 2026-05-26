# Live Orders — Code Logics

## Initialization (BROKEN)
- initLiveOrders() is mapped as initMap["live-orders"]
- Nav link uses data-tab="liveorders" — mapping never found
- If reached: reads all orders across all businesses/outlets

## Data Loading
- Iterates /businesses/{bid}/outlets/{oid}/orders for all businesses
- Flattens into single orders array with business/outlet metadata attached
- Sorts by timestamp descending (newest first)

## View Modes
- Table view: Renders orders in sortable table
- Kanban view: Renders orders in drag-drop columns by status
- Toggle button queries .view-toggle-btn (BUG: class doesn't exist)
- Toggle logic queries .orders-view-toggle .active (BUG: class doesn't exist)

## Status Management
- Status dropdown per order row
- updateOrderStatus(bid, oid, orderId, newStatus) writes to orders/{id}/status
- Kanban columns: pending, confirmed, preparing, out_for_delivery, delivered, cancelled

## Kanban Drag-Drop
- Uses native HTML5 drag/drop API (dragstart, dragover, drop)
- On drop: updates order status to target column's status
- No drag-drop library dependency

## Status Filter (BROKEN)
- Filter buttons query .order-status-filter (BUG: class doesn't exist)
- No client-side filtering applied to orders array

## Table Columns (BUG)
- HTML header: Order ID, Customer, Outlet, Items, Total, Status, Time, Actions
- Rendered cells: orderId, businessName, customerName, total, status, time, actions
- Missing: Items column; wrong order; extra businessName
- No: Outlet column in rendered output
