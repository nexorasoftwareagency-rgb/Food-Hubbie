# Reviews Tab — Important Points

1. **Full scan on load**: Reads reviews from ALL outlets — expensive query for large ecosystems
2. **No real-time updates**: Uses `once('value')` — manual refresh required
3. **Rating filter**: Client-side filtering after full data load
4. **Outlet name denormalized**: Stored on review for display without additional lookups
5. **No review deletion**: Read-only tab — admin cannot remove reviews
6. **Scoreboard decimals**: Rating displayed to 1 decimal place
7. **Review list limit**: Shows most recent reviews first, no pagination
