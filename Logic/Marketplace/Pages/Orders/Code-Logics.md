# Orders Page — Code Logics

## Overview
Order history page showing all past and active orders.

## Data Source
- `OrderContext.orders` — array of `Order` objects
- Seeded from localStorage (`foodhubbie_orders`) on mount
- Synced from Firebase when authenticated (via OrderContext effect)

## Key Logic
- **Status badges**: Color-coded badges for each order status
- **Filter tabs**: All / Active / Completed / Cancelled
- **Reorder**: Navigate to outlet + pre-fill items (future)
- **Empty state**: "No orders yet" with CTA to browse restaurants

## Decisions
- Orders stored in localStorage for offline access
- Tab-based filtering (not search) for simplicity
- Reorder button navigates to outlet (no cart pre-fill yet)
- "Leave Review" shortcut for delivered orders

## Firebase
- Reads: `fetchOrdersFromFirebase(userId)` — reads orders across all outlets for user
- No direct writes from this page
