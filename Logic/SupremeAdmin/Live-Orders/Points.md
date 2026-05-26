# Live Orders — Points

## Key Implementation Details
- initLiveOrders() uses once('value') not on('value') — single read, no real-time
- Status update writes only the status field (not entire order)
- Kanban uses native HTML5 drag/drop — no external library
- Each order rendered with business name and outlet name prepended

## Fixed Bugs
1. ~~**CRITICAL**: initMap["live-orders"] never reached — tab doesn't initialize~~ **FIXED**
2. ~~**HIGH**: View toggle queries non-existent classes — can't switch to Kanban~~ **FIXED**
3. ~~**HIGH**: Status filter queries non-existent classes — can't filter~~ **FIXED**
4. ~~**LOW**: Table column order mismatch — header now aligned with rendered columns~~ **FIXED**

## Gotchas
- No real-time updates — page must be refreshed to see new orders
- No auto-refresh mechanism
- Kanban drag-drop has no visual feedback (no drag ghost styling)
- Status update has no confirmation dialog
- No loading state — table appears empty until data loads
- No error handling for failed status writes
