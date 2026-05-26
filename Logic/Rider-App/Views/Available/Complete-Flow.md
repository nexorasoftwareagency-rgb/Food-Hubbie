# Available View — Complete Flow

## Page Load Sequence
```
1. Rider navigates to "Pickup" from sidebar
2. window.showAvailableOrders() called
3. Load all businesses:
   a. db.ref('businesses').once('value')
   b. For each business → load outlets
   c. For each outlet → query orders (status="Placed", !assignedRider)
4. Calculate distance from rider location to each order's outlet
5. Sort by distance (nearest first)
6. Render order cards in #pickupList container
7. Start real-time listener for:
   a. child_added — new available orders
   b. child_changed — order assigned (remove from list)
```

## Accept Flow
```
1. Rider taps "Accept" on order card
2. Proximity check: getDistance() ≤ 1km
3. If online:
   a. Firebase transaction on businesses/{b}/outlets/{o}/orders/{id}
   b. Transaction checks: !data.exists() || !data.child('assignedRider').val()
   c. If success: set assignedRider = uid, riderName, riderPhone
   d. Generate deliveryOTP (4-digit random)
   e. Update order.status or notify
   f. Push to botCommands for WhatsApp notification
   g. Navigate to sec-active view
4. If offline:
   a. Push ACCEPT_ORDER to localStorage queue
   b. Show "Queued for sync" toast
5. If proximity fails:
   a. Show "Too far from outlet" error toast
   b. Don't remove from list
6. If transaction fails (already assigned):
   a. Show "Order was already taken" toast
   b. Remove from list
```

## Skip Flow
```
1. Rider taps "Skip" on order card
2. Add orderId to skippedOrders set (session memory)
3. Remove card from DOM
4. Listener ignores child_changed for skipped orders
```
