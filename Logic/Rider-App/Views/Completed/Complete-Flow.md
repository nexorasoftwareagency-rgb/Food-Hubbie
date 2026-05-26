# Completed View — Complete Flow

## Page Load Sequence
```
1. Rider navigates to "Trip History" from sidebar
2. window.showCompletedDeliveries() called
3. Read riders/{uid}/ledger (once)
4. Filter entries where type === "delivery" AND status === "completed"
5. Sort by timestamp descending (newest first)
6. Apply default date filter (Today)
7. Take first 50 entries
8. Render order cards in #completedList
9. If more than 50 → show "Load More" button
10. If 0 → show empty state
```

## Search & Filter Flow
```
1. Rider taps search icon or date filter tab
2. Search: rider types in #completedSearch
3. 300ms debounce → filter rendered cards by customerName or orderId
4. Date filter: recalculate visible range → re-query data or re-filter loaded
5. All filters combine (date + search text)
6. "Clear filters" link if both active
```

## Card Tap Flow
```
1. Rider taps completed order card
2. Extract bid, oid from ledger entry (or orderId)
3. Read businesses/{b}/outlets/{o}/orders/{orderId} (once)
4. Open #orderDetailModal with full order data:
   ├─ Order ID, date, status
   ├─ Customer info (name, phone, address)
   ├─ Items list with quantities & prices
   ├─ Payment summary (total, delivery fee, collected)
   └─ Timeline (accepted → picked up → delivered)
5. Rider taps "Close" → dismiss modal
```

## Load More Flow
```
1. Rider taps "Load More" button
2. Load next 50 entries from ledger (offset by current count)
3. Append cards to #completedList
4. If no more entries → hide "Load More" button
5. Show "Showing X of Y deliveries" count
```
