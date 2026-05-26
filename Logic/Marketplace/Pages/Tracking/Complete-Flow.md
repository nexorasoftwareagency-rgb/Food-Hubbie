# Tracking Page — Complete Flow

## User Journey

```
1. User navigates to /tracking/{orderId} (after placing order or from Orders list)
2. OrderContext.getOrderById(orderId) retrieves order from state
3. If order found:
   ├─ Display header: outlet name, order ID
   ├─ Calculate statusIndex(order.status) → currentIdx
   ├─ Render status pipeline:
   │   ├─ Completed statuses (≤ currentIdx): green checkmark + icon
   │   ├─ Current status: animated pulse + icon + stage message
   │   └─ Upcoming statuses: greyed out
   ├─ Show current status card with ETA
   ├─ If rider assigned: show rider card (name, phone, vehicle)
   ├─ Show order summary (items, total)
   └─ If Delivered: show "Rate your order" button → opens ReviewModal
4. If order not found:
   └─ Show "Order not found" fallback
5. ReviewModal:
   ├─ Rate food (1-5 stars)
   ├─ Rate rider (1-5 stars, if applicable)
   ├─ Write comment
   └─ Submit → reviewService + markOrderAsReviewed()
```
