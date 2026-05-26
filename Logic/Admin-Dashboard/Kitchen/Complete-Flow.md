# KitchenPage Complete Flow

## User Journey

```
Admin opens KitchenPage
  → onValue fetches orders → filters to KITCHEN_ST statuses
  → 60s interval starts → statusTimers increment
  → Card grid renders sorted by priority + oldest first

Admin actions:
  ├── Advance single order
  │   → advance(id) → flow[status] → update status → real-time re-render
  ├── Advance all eligible
  │   → advanceAll() → sequential updates → real-time re-render
  ├── Cancel order
  │   → confirm → update to "Cancelled" → re-render
  ├── View detail modal
  │   → selected order → full info + items + special instructions
  ├── Filter by status
  │   → filter pills with counts → filtered computed → re-render
  └── Search orders
      → search by orderId or customerName → filtered computed → re-render

Real-time updates:
  ← Firebase pushes changes → onValue fires → re-render
  ← Timer ticks every 60s → HOLD badges update
```

## Status Flow
```
Placed ──→ Confirmed ──→ Preparing ──→ Cooked ──→ Ready
  │           │              │             │          │
  └── Cancel ─┴── Cancel ───┴── Cancel ───┴── Cancel ─┘
```

## Visual Layout
```
┌─────────────────────────────────────────────────────────┐
│ [All(12)] [Placed(3)] [Confirmed(4)] [Preparing(2)]    │
│ [Cooked(2)] [Ready(1)]  🔍 [Advance All]               │
├─────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ ██ Placed│  │ ██ Conf. │  │ ██ Prep. │               │
│ │ #ORD-001 │  │ #ORD-002 │  │ #ORD-003 │               │
│ │ ⏱ 12min  │  │ ⏱ 5min   │  │ ⏱ 8min   │               │
│ │ 🟡 HOLD  │  │ Customer │  │ Customer │               │
│ │ Customer │  │ ...      │  │ ...      │               │
│ │ Cancel   │  │ Cancel   │  │ Cancel   │               │
│ │ [Confirm]│  │[Start Pr]│  │[Mk Cook] │               │
│ └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────┘
```
