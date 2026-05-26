# LiveOpsPage Code Logics

**File**: App.jsx lines 1353-1610  
**Component**: `LiveOpsPage`

## Props
- `showToast` — notification trigger

## State
| Variable | Type | Description |
|----------|------|-------------|
| `orders` | array | All orders from Firebase |
| `riders` | array | All riders from Firebase |
| `search` | string | Search query |
| `statusFilter` | string | Status filter (default: `"all"`) |
| `editing` | object/null | Order being edited in modal |
| `advancing` | Set | Set of order IDs currently being advanced |

## Effects
```javascript
// Fetch orders
onValue(Outlet("orders"), (snap) => {
  const arr = [];
  snap.forEach((doc) => arr.push({ id: doc.key, ...doc.val() }));
  setOrders(arr);
});

// Fetch riders
onValue(ref(db, "riders"), (snap) => {
  const arr = [];
  snap.forEach((doc) => arr.push({ id: doc.key, ...doc.val() }));
  setRiders(arr);
});
```

## Computed

### `activeOrders`
- Filters out orders with status `"Delivered"` or `"Cancelled"`

### `filteredOps`
1. Filter by `statusFilter` (if not `"all"`)
2. Filter by `search` — matches `customerName`, `orderId`, or `phone`
3. Sort by `PRIORITY` map (ascending), then by `createdAt` (ascending oldest-first)

```javascript
const PRIORITY = {
  Placed: 0, Confirmed: 1, Preparing: 2, Cooked: 3,
  Ready: 4, "Out for Delivery": 5, "Reached Drop Location": 6
};
```

## Handlers

### `advance(id)`
- Finds order by id
- Gets `idx = SEQ.indexOf(order.status)`
- If idx === -1 or idx >= SEQ.length - 1 → return early
- Next status = `SEQ[idx + 1]`
- If next status is `"Out for Delivery"` and no `riderId` → reject with toast
- Uses `setAdvancing(prev => new Set(prev).add(id))` to track
- Writes `update(Outlet(`orders/${id}`), { status: next, updatedAt: serverTimestamp() })`
- Removes from advancing set on completion

### `cancel(id)`
- Rejects if status is `"Delivered"`
- Shows `window.confirm("Are you sure you want to cancel this order?")`
- Writes `update(Outlet(`orders/${id}`), { status: "Cancelled", updatedAt: serverTimestamp() })`

### `saveOperation()`
- If `editing.id` exists in orders → `update(Outlet(`orders/${editing.id}`), editing)`
- Else → `push(Outlet("orders"), { ...editing, status: "Placed", createdAt: serverTimestamp() })`

### `deleteOperation(id)`
- `window.confirm` → `remove(Outlet(`orders/${id}`))`

### `assignRider(orderId, riderId)`
- Validates rider exists in riders array
- Writes:
```javascript
update(Outlet(`orders/${orderId}`), {
  riderId,
  assignedRider: rider?.email || "",
  riderName: rider?.name || "Unnamed",
  riderPhone: rider?.phone || "",
  assignedAt: serverTimestamp()
});
```

### `exportOperations()`
- CSV download with columns: row number, orderId, customerName, phone, items, total, type, status, address

### `relTime(ts)`
```javascript
const diff = Date.now() - ts;
if (diff < 60000) return "just now";
if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
const hrs = Math.floor(diff / 3600000);
const mins = Math.floor((diff % 3600000) / 60000);
return `${hrs}h ${mins}m ago`;
```

## Renders

### Top Row: 4 KPI Cards
1. **Live Orders** — count of activeOrders
2. **Pending Accept** — count where status === "Placed"
3. **In Kitchen** — count where status in `["Confirmed","Preparing","Cooked","Ready"]`
4. **Out for Delivery** — count where status === "Out for Delivery"

### Live Operations Sheet
- Full table with columns: Progress dots (SEQ.map), Order ID, Customer, Items, Total, Status (with progress bar), Time (relTime), Action buttons
- Action buttons show large pill with next status label, color-coded

### Flow Labels
| Status | Button Label |
|--------|-------------|
| Placed | Accept |
| Confirmed | Prep |
| Preparing | Cook |
| Cooked | Ready |
| Ready | Dispatch |
| Out for Delivery | Arrive |
| Reached Drop Location | Deliver |

### Live Order Feed Card
- Latest 10 active orders
- Each with Accept button for Placed orders

### Rider Activity Card
- Shows MOCK_RIDERS data (static, not from Firebase)
- Rider name, status, vehicle, deliveries count

### New/Edit Modal
- Fields: customerName, phone, total, type, address
- Save creates new or updates existing order
