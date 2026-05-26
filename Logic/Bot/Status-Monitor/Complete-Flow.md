# Bot Status Monitor (status-monitor.js) — Complete Flow

## Order Lifecycle Notification Flow

```
1. BOT STARTS
   └─ initStatusMonitor(sock)
       ├─ Attaches child_added listener (existing + new orders)
       └─ Attaches child_changed listener (status updates)

2. NEW ORDER CREATED (child_added)
   ├─ Is order > 10 min old?
   │  ├─ YES → mark processedStatus, skip
   │  └─ NO → handleStatusUpdate(isNew=true)
   │
   └─ handleStatusUpdate:
       ├─ Mark processedStatus
       ├─ Notify admin via WhatsApp (reportPhone)
       ├─ Notify admin via FCM (notifyAdmins)
       └─ Send "Confirmed" message to customer

3. ORDER STATUS CHANGED (child_changed)
   └─ handleStatusUpdate:
       ├─ Check if status or riderId changed → skip if same
       ├─ If rider changed → notifyRiderAssignment()
       ├─ Send status-specific message + image to customer:
       │   Confirmed → "ORDER CONFIRMED"
       │   Preparing → "PREPARING YOUR MEAL"
       │   Cooked → "COOKING COMPLETE"
       │   Ready/Packed → "ORDER READY"
       │   Out for Delivery → "OUT FOR DELIVERY" (with OTP)
       │   Reached Drop → "RIDER ARRIVED" (with OTP)
       │   Delivered → "DELIVERED"
       │   Cancelled → "ORDER CANCELLED"
       └─ If no rider AND status Cooked/Ready/Packed:
           └─ broadcastPickupAvailable()
               ├─ Fetch online riders
               ├─ Send broadcast message to each
               └─ Create in-app notification for each
```
