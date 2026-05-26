# Reviews — Complete Flow

## User Journey
1. Admin clicks Reviews tab → initReviews() fires
2. One-time read of all reviews across all businesses/outlets
3. Review cards rendered (newest first):
   - User name + Business/Outlet name
   - Star rating (★ ★ ★ ★ ☆)
   - Comment text (truncated to 100 chars)
   - Relative timestamp ("2h ago", "3d ago")
4. Admin can only view — no actions available
5. No refresh needed for new reviews (but must manually refresh to see new ones)

## Data Flow
/businesses/{bid}/outlets/{oid}/reviews → once('value') →
  flattenWithMetadata() → sortByTimestampDesc() →
  renderCards() → display in .tab-content

## Limitations
- No way to delete inappropriate reviews
- No way to reply to reviews
- No way to filter by rating (e.g., show only 1-star reviews)
- All businesses' reviews shown together — overwhelming if many businesses
