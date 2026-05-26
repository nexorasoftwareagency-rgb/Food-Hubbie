# Outlets Tab — Code Logics

## Purpose
Outlet profile management — list all outlets with search, view detailed analytics modal, edit outlet configuration.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadOutletsTab()` | Tab load | Load all businesses + admins, build outlet list |
| `filterOutletList()` | Search input | Client-side filter by outlet name |
| `renderOutletList()` | Data ready / filter | Paginated outlet table |
| `showOutletProfile(bid, oid)` | Profile button | Full outlet analytics modal |
| `hideOutletProfile()` | Close button | Hide modal |
| `showOutletModal(bid, oid)` | Edit button | Open outlet edit form |
| `updateOutlet()` | Save button | Atomic outlet + meta + admin updates |

## Outlet List Columns
| Column | Data Source |
|---|---|
| Outlet Name | `outlet.name` |
| Business | `business.name` (parent) |
| Slug | `outlet.slug` |
| Status | `outlet.isActive` → badge |
| Admin Email | From admins lookup |
| Registered | `outlet.registeredAt` formatted |
| Actions | Profile / Edit buttons |

## Outlet Profile Modal
```
showOutletProfile(bid, oid):
  1. Read businesses/{bid}/outlets/{oid}
  2. Read businesses/{bid}/outlets/{oid}/orders (limited)
  3. Compute analytics:
     ├─ Total Orders count
     ├─ Total Revenue sum
     ├─ Average Order Value totalRevenue / totalOrders
     └─ Average Rating from reviews
  4. Render profile modal with all data
  5. lucide.createIcons()
```

## Outlet Edit Modal
```
showOutletModal(bid, oid):
  1. Read current outlet data
  2. Pre-fill form fields
  3. Show modal with save button

updateOutlet():
  1. Read form values
  2. Multi-path update:
     ├─ businesses/{bid}/outlets/{oid}.update(...)
     └─ system/admins/{adminUid}.update({ password: newPassword })
  3. logAdminAction('OUTLET_UPDATED', { bid, oid })
  4. showToast("Outlet updated")
```

## Edge Cases
- **No outlets** → "No outlets registered" empty state
- **Outlet with missing business** → Show "Orphaned" badge
- **Profile with no orders** → Analytics show "N/A" or 0
- **Search no results** → "No outlets match your search"
