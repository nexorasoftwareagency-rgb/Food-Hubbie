# Bot Status Monitor (status-monitor.js) — Decisions

| Decision | Rationale |
|---|---|
| **In-memory dedup** (`processedStatus`) | Prevents duplicate messages on Firebase re-triggers; lost on restart (acceptable) |
| **10-min old-order skip** | On first connect, existing orders older than 10 min are marked processed without notification |
| **Rider change tracked separately** | A rider re-assignment should notify the new rider even if order status hasn't changed |
| **Broadcast only to online riders** | Avoids spamming offline/unavailable riders |
| **Image fallback chain** (e.g., `imgCooked || imgPreparing`) | Graceful degradation if image not configured in Bot settings |
| **OTP shown in Out for Delivery + Reached** | Customer needs OTP for delivery verification; shown twice for visibility |
| **`notifyAdmins()` via FCM** | Redundant with WhatsApp admin notification — ensures admin sees new orders even if WhatsApp is down |
