# Orders Page — Complete Flow

```
1. User navigates to /orders
2. OrderContext provides orders (localStorage cache + Firebase fetch)
3. Render:
   ├─ Filter tabs: All / Active / Completed / Cancelled
   ├─ Order cards sorted by date (newest first):
   │   ├─ Outlet name, status badge, total, date
   │   ├─ Items summary preview
   │   ├─ Tap to expand full details
   │   ├─ "Track" button (active orders) → /tracking/{id}
   │   ├─ "Reorder" button → /store/{slug}
   │   └─ "Review" button (delivered, not reviewed) → ReviewModal
   └─ Empty state: "No orders yet" + "Browse Restaurants" CTA
```
