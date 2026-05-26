# Home View — Complete Flow

## Page Load Sequence
```
1. Rider logs in → onAuthStateChanged fires
2. Auth check: if uid exists and role === "rider"
3. Show sec-home (set display:block, hide others)
4. Call showDashboard():
   a. Read riders/{uid} (profile)
   b. Set #riderPhoto.src, #riderName.textContent
   c. Set #riderGreeting.textContent from getGreeting()
   d. Read riderStats/{uid}/today
   e. Populate stats grid (delivered, on-time, earnings, rating)
   f. Query orders where assignedRider === uid AND status !== "Delivered"
   g. If active order found → show #activeDeliveryCard
   h. If no active order → show "No active deliveries" message
5. Listen for child_changed on active order (real-time status updates)
6. Initialize sidebar with current rider data
7. Start notification count polling
```

## User Interactions
| Action | Result |
|---|---|
| Tap active delivery card | Navigate to sec-active view |
| Tap stats card | Navigate to sec-earnings |
| Tap bell icon | Open #notificationSheet |
| Pull down | Refresh dashboard data |
| Tap sidebar hamburger | Open navigation drawer |
