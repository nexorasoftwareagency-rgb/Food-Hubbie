# Businesses Tab — Code Logics

## Purpose
Dedicated business entity management — view all registered partners with admin details.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadBusinessesTab()` | Tab load | Load businesses + admin data, build enriched list |
| `renderBusinessesAlt(list)` | Data ready | Paginated business table |
| `goToBusinessesPage(page)` | Pagination | Switch page |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `businesses` | `once('value')` | All businesses |
| `system/admins` | `once('value')` | Admin email lookup |

## Table Columns
| Column | Data Source |
|---|---|
| Partner Identity | `business.name` |
| Admin Authority | Looked up from `system/admins` where admin has `role=business` matching this bid |
| Scale (Nodes) | Number of outlets |
| Commission Model | `business.commission` % |
| Network Status | `business.isActive` → badge |
| Operations | View/Edit (go to outlet) |

## Pagination
- Page size: 10 businesses per page
- PAGINATION.businesses object tracks `{ page, pageSize, total }`
- renderPagination() for page controls

## Edge Cases
- **No businesses** → "No partners registered" empty state
- **Admin not found** → Show "Unassigned" in Admin Authority column
- **Business with 0 outlets** → Show "0 nodes", still editable
