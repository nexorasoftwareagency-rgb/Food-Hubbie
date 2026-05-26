# SuperAdmin — Pagination System

## Overview
Client-side pagination used across multiple tabs (Users, Audit, Businesses, Riders).

## Core Function
```javascript
function paginateArray(arr, page, pageSize) {
  const start = (page - 1) * pageSize;
  return arr.slice(start, start + pageSize);
}
```

## State Tracking
```javascript
const PAGINATION = {
  users:    { page: 1, pageSize: 10, total: 0 },
  audit:    { page: 1, pageSize: 20, total: 0 },
  businesses: { page: 1, pageSize: 10, total: 0 },
  riders:   { page: 1, pageSize: 10, total: 0 }
};
```

## Rendering
```javascript
function renderPagination(containerId, stateKey, onChange) {
  // Build page number buttons with smart ellipsis
  // Show: first, last, current ±2, with "..." for gaps
  // Active page highlighted
  // Previous/Next buttons
  // Page size selector (optional)
}
```

## Integrated Tabs
| Tab | Container | State Key | Page Size |
|---|---|---|---|
| User Registry | `#usersPagination` | users | 10 |
| Security Audit | `#auditPagination` | audit | 20 |
| Managed Entities | `#businessesPagination` | businesses | 10 |
| Rider Management | `#ridersPagination` | riders | 10 |

## Smart Page Numbers
- Always show first and last page
- Show 2 pages around current
- Fill gaps with "..."
- Example (page 5 of 20): `1 ... 3 4 [5] 6 7 ... 20`

## Edge Cases
- **Single page** → No pagination shown
- **Empty data** → No pagination shown
- **Page out of bounds** → Clamp to valid range
