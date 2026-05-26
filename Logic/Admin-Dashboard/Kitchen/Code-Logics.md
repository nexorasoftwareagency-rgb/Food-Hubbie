# KitchenPage Code Logics

**File**: App.jsx lines 1615-1810  
**Component**: `KitchenPage`

## Props
- `showToast` — notification trigger

## State
| Variable | Type | Description |
|----------|------|-------------|
| `kitchenOrders` | array | Orders filtered to KITCHEN_ST statuses |
| `statusTimers` | object | Timer counters keyed by `{id}+{status}` |
| `selected` | object/null | Selected order for detail modal |
| `filter` | string | Status filter (default: `"all"`) |
| `search` | string | Search query |

## Constants
```javascript
const KITCHEN_ST = ["Placed", "Confirmed", "Preparing", "Cooked", "Ready"];

const kColors = {
  Placed: "#f59e0b",
  Confirmed: "#3b82f6",
  Preparing: "#8b5cf6",
  Cooked: "#06b4e6",
  Ready: "#0ea5e9"
};

const flow = {
  Placed: "Confirmed",
  Confirmed: "Preparing",
  Preparing: "Cooked",
  Cooked: "Ready"
};

const actLabels = {
  Placed: "Confirm",
  Confirmed: "Start Prep",
  Preparing: "Mark Cooked",
  Cooked: "Mark Ready"
};

const PRIORITY = {
  Placed: 0, Confirmed: 1, Preparing: 2, Cooked: 3, Ready: 4
};
```

## Effects

### Fetch kitchen orders
```javascript
onValue(Outlet("orders"), (snap) => {
  const arr = [];
  snap.forEach((doc) => {
    const o = { id: doc.key, ...doc.val() };
    if (KITCHEN_ST.includes(o.status)) arr.push(o);
  });
  setKitchenOrders(arr);
});
```

### Timer interval
```javascript
useEffect(() => {
  const t = setInterval(() => {
    setStatusTimers((prev) => {
      const nxt = { ...prev };
      kitchenOrders.forEach((o) => {
        if (KITCHEN_ST.includes(o.status)) {
          const k = o.id + o.status;
          nxt[k] = (prev[k] || 0) + 1;
        }
      });
      return nxt;
    });
  }, 60000);
  return () => clearInterval(t);
}, [kitchenOrders]);
```

## Computed

### `filtered`
1. Filter by `filter` (if not `"all"`)
2. Filter by `search` — matches `orderId` or `customerName`
3. Sort by `PRIORITY` (ascending), then by `statusTimers[id+status]` descending (oldest first)

### `counts`
- Per-status counts: `{ Placed: N, Confirmed: N, Preparing: N, Cooked: N, Ready: N }`

### `total`
- `kitchenOrders.length`

## Helpers
```javascript
const getItems = (o) => Array.isArray(o.cart) ? o.cart : (Array.isArray(o.items) ? o.items : (o.items ? Object.values(o.items) : []));
const getNotes = (o) => o.notes || o.specialInstructions || "";
```

## Handlers

### `advance(id)`
```javascript
const order = kitchenOrders.find((o) => o.id === id);
const next = flow[order?.status];
if (!next) return;
await update(Outlet(`orders/${id}`), { status: next });
showToast(`${order.orderId||order.id.slice(-6)} → ${ORD_ST[next].label}`, "success");
```

### `advanceAll()`
```javascript
const eligible = kitchenOrders.filter((o) => flow[o.status]);
if (!eligible.length) return showToast("No orders to advance", "info");
for (const o of eligible) {
  await update(Outlet(`orders/${o.id}`), { status: flow[o.status] })
    .catch(() => {});
}
showToast(`${eligible.length} order${eligible.length>1?"s":""} advanced`, "success");
```

### `cancelOrder(id)`
```javascript
if (!confirm("Cancel this order?")) return;
await update(Outlet(`orders/${id}`), { status: "Cancelled" });
setSelected(null);
showToast("Order cancelled", "info");
```

## Renders

### Header Bar
- Total active orders count
- Status filter pills with per-status counts
- Search input
- Advance All button

### Card Grid
- Each card has:
  - Colored top bar (matching `kColors[status]`)
  - Order ID
  - HOLD badge (shown when timer >= 10 minutes)
  - Timer display in minutes
  - Customer name
  - Delivery address
  - Items: count + type + total
  - StatusBadge component
  - Cancel + Advance buttons

### Detail Modal
- Full order information
- Items list with `item.lineTotal || item.total || item.price` per line
- Special instructions with amber warning background
- Cancel + Advance buttons

## Empty States
- `"No orders match your search"` — when filter/search yields no results
- `"Kitchen is clear! No active orders."` — when kitchenOrders is empty
