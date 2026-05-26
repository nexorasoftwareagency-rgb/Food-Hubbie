# LiveOpsPage Complete Flow

## User Journey

```
Admin opens LiveOpsPage
  → onValue fetches orders + riders (real-time)
  → activeOrders computed (excludes Delivered/Cancelled)
  → filteredOps sorted by priority + time
  → 4 KPI cards display counts
  → Operations Sheet renders
  → Live Order Feed shows latest 10
  → Rider Activity shows mock data

Admin actions:
  ├── Advance order (next SEQ step)
  │   → advance() validates → updates status → real-time re-render
  ├── Cancel order
  │   → confirm → updates to "Cancelled" → real-time re-render
  ├── Assign rider
  │   → assignRider() validates → writes rider fields → re-render
  ├── Create new order
  │   → modal → push() to Firebase → real-time re-render
  ├── Edit existing order
  │   → modal → update() → real-time re-render
  ├── Delete order
  │   → confirm → remove() from Firebase → re-render
  └── Export CSV
      → downloadCSV() with formatted rows
```

## Data Flow
```
Firebase RTDB ──onValue──→ LiveOpsPage state ──filtered──→ Operations Sheet
                                     │                        │
                                     │                        ├── Advance → write back
                                     │                        ├── Cancel → write back
                                     │                        └── Assign → write back
                                     │
                                     └── Live Order Feed (latest 10 active)
```
