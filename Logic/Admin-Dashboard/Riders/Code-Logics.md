# Code-Logics: RidersPage

**Location**: App.jsx lines 1902-2112

## Props
- `{ showToast }`

## State
- `riders` — from `MOCK_RIDERS`
- `selected` — rider object for detail modal
- `filter` — filter text
- `search` — search query
- `view` — `"table"` or `"grid"`

## Computed KPIs
- **Online** — count of riders with status "online"
- **On Delivery** — count of riders with status "on_delivery"
- **Completion Rate** — average `(completed / totalOrders) * 100` across all riders
- **Avg Rating** — average of all rider ratings

## Handlers
- `toggleStatus(id)` — toggles rider status locally (no Firebase write)
- `exportCSV()` — generates CSV download of rider data

## Renders
- **4 KPICards**: Online, On Delivery, Completion Rate, Avg Rating
- **Table view**: Avatar, name, phone, status badge (colored dot), vehicle, deliveries count with bar, earnings, rating, zone, completion bar, Activate/Deactivate button
- **Grid view**: same data presented as cards
- **Detail modal**: 4 stat cards (earnings, deliveries, rating, completion), vehicle/zone/joined/total orders info, weekly earnings AreaChart from `RIDER_CHART` data
