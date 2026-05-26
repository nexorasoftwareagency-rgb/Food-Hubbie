# KitchenPage Decisions

## Limited Status Scope
- Shows only 5 statuses: `Placed → Confirmed → Preparing → Cooked → Ready`
- Hides delivery/dispatch steps — designed for kitchen display only
- Kitchen staff only sees what matters to them

## Status Timer
- Tracked by composite key `{id}+{status}`
- Timer resets automatically when order advances to a new status
- Different key = fresh counter

## 60-Second Interval
- Uses 60s interval (not 1s) — kitchen doesn't need second-level precision
- Fewer renders = better performance
- Sufficient for tracking hold times

## HOLD Badge
- Shown when timer >= 10 minutes in current status
- Visual indicator for orders taking too long
- Helps prioritize stalled orders

## `advanceAll()` Sequential Processing
- Uses `for...of` with `await` — processes one at a time
- Avoids Firebase write conflicts from parallel updates
- Slower but safer

## Per-Status Colors
- Each kitchen status has a distinct color:
  - Placed: amber, Confirmed: blue, Preparing: purple, Cooked: cyan, Ready: sky
- Helps kitchen staff quickly identify order stage at a glance
