# OrdersPage Complete Flow

See `D:\Foodhubbie\Logic\Admin-Dashboard\06-Complete-Flows.md` — **Flow 3: Order Management Lifecycle**

## Overview

```
Admin opens OrdersPage
  → onValue fetches orders + riders (real-time)
  → filtered computed based on tab/search/date
  → Table renders with status + rider dropdowns

Admin actions:
  ├── View order detail → modal with full info + map link
  ├── Update status → dropdown → updateStatus() validates → Firebase write
  ├── Assign rider → dropdown → assignRider() fetches + writes
  ├── Delete order → confirm → remove() from Firebase
  └── Export CSV → downloadCSV() with formatted columns

Real-time updates:
  ← Firebase pushes changes → onValue fires → re-render
```
