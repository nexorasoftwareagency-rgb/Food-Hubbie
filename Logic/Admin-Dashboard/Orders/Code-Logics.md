# OrdersPage Code Logics

**File**: App.jsx lines 400-614  
**Component**: `OrdersPage`

## Props
- `showToast` — notification trigger
- *No `outletInfo` — this page does not use outlet metadata*

## State
| Variable | Type | Description |
|----------|------|-------------|
| `search` | string | Search query |
| `orderTab` | `"all"\|"live"\|"history"` | Active tab |
| `orders` | array | All orders from Firebase |
| `selOrder` | object/null | Selected order for detail modal |
| `riders` | array | All riders from Firebase |
| `fromDate` | string | Date range start (YYYY-MM-DD) |
| `toDate` | string | Date range end (YYYY-MM-DD) |

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

## Computed: `filtered`
1. Filter by `orderTab`:
   - `"live"` → `LIVE_ST` = ["Placed","Confirmed","Preparing","Cooked","Ready","Out for Delivery","Pending","New"]
   - `"history"` → status NOT in `LIVE_ST`
   - `"all"` → no status filter
2. Filter by `search` — matches `customerName`, `phone`, `orderId`, or raw `o.id`
3. Filter by date range — compares `createdAt` ISO string against `fromDate`/`toDate`
4. Sort by `createdAt` descending

## Handlers

### `updateStatus(id, status)`
- Finds order by id
- Determines `curLvl` (index in `SEQ`) and `newLvl`
- **Validation**: rejects if `curLvl + 1 !== newLvl` unless status is `"Cancelled"`
- Rejects cancel if current status is `"Delivered"`
- Requires `riderId` before advancing to `"Out for Delivery"`
- Writes to Firebase:
```javascript
update(Outlet(`orders/${id}`), {
  status,
  paymentStatus: status === "Delivered" ? "Paid" : order.paymentStatus
});
```

### `assignRider(orderId, riderId)`
- Fetches order by id
- Fetches rider from `riders/${riderId}`
- Writes assignment:
```javascript
update(Outlet(`orders/${orderId}`), {
  riderId,
  assignedRider: rider?.email,
  riderName: rider?.name,
  riderPhone: rider?.phone,
  assignedAt: serverTimestamp()
});
```

### `deleteOrder(id)`
- Confirms via `window.confirm`
- Calls `remove(Outlet(`orders/${id}`))`
- Closes modal, shows "Order deleted" toast

### `exportOrders()`
- Generates CSV via `downloadCSV("orders-{date}.csv", ...)`
- Columns: `row (#), orderId, customer, phone, items (orderItemsText()), itemCount, total, paymentMethod, paymentStatus, status, rider, createdAt`

### `activeRiders`
- `riders.filter(r => r.status === "Online" || r.status === "On Delivery")`

## Renders

### Toolbar
- Search input
- From/To date pickers (`<input type="date">`)
- Tab buttons: All / Live (`count`) / History
- Export CSV button

### Orders Table
- Columns: #, Order ID, Customer, Phone, Items, Total, Payment, Status (dropdown), Rider (dropdown), Created, Actions (View / Delete)

### Order Detail Modal
- Customer info block
- Delivery address with Google Maps link (`https://www.google.com/maps?q=${lat},${lng}`)
- Items list
- Pricing breakdown in dark card (`#0f172a`): subtotal, discount, deliveryFee, total
- Status dropdown (all SEQ statuses + Cancelled)
- Rider assignment dropdown (activeRiders only)

### Constants Used
- `SEQ = ["Placed","Confirmed","Preparing","Cooked","Ready","Out for Delivery","Reached Drop Location","Delivered"]`
- `LIVE_ST = ["Placed","Confirmed","Preparing","Cooked","Ready","Out for Delivery","Pending","New"]`
