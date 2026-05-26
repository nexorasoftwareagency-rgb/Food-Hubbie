# Home View — Important Points

1. **Greeting logic**: `window.getGreeting()` returns "Good Morning" (5-11), "Good Afternoon" (12-16), "Good Evening" (17+)
2. **Stats refresh**: Stats re-fetch each time view is shown (not cached beyond session)
3. **Active order detection**: Checks if rider has any order with status in ["Confirmed", "Out for Delivery", "Reached Drop Location"]
4. **Rating display**: Shows "New" if 0 ratings, otherwise `displayRating` function rounds to 1 decimal
5. **Photo fallback**: If no `photoURL`, shows circle with first letter of name in white on orange background
6. **Notification badge**: Unread notification count shown as badge on bell icon
7. **Pull-to-refresh**: Mobile pull gesture re-invokes `showDashboard()`
8. **Offline state**: Dashboard shows cached data with "Offline — Showing cached data" banner
