# Home Page — Points

## Edge Cases
- **No outlets in area** → outlet count is 0; most sections render empty; "no items" empty state shown
- **Location denied** → address shows "Detecting location..."; outlets not sorted by distance
- **All locations denied and no saved address** → outlets shown but distance = 0 for all
- **Cuisines empty** → horizontal scroll section simply absent
- **No reviews** → review section absent

## Gotchas
- `fetchAllMenuItems()` fetches ALL dishes from ALL outlets — large payload for many outlets
- `fetchGlobalReviews(6)` reads all reviews — no limit at Firebase level; limit is client-side after fetch
- Location refresh on `coords` change triggers full data reload (all API calls)
- Hero search uses uncontrolled form input — no validation beyond `.trim()`

## Future Improvements
- Add pagination/infinite scroll for global menu
- Cache outlet list in localStorage for faster repeat visits
- Add skeleton loading states per-section (not just blanket loading)
- Implement Pro Membership flow instead of toast
