# Reviews — Code Logics

## Initialization
- initReviews() reads reviews from all businesses/outlets
- Iterates /businesses/{bid}/outlets/{oid}/reviews for all businesses

## Data Loading
- One-time read (not listener) of all reviews
- Flattens to array with business/outlet metadata
- Sorts by timestamp descending (newest first)

## Review Display
- Each review card shows:
  - User name
  - Rating stars (filled/empty based on rating value, out of 5)
  - Comment (truncated to 100 characters)
  - Timestamp (relative time via timeAgo())
  - Business/Outlet name (from path metadata)

## Rating Stars
- Rendered as inline HTML: filled star (★) for each rating point, empty star (☆) for remaining
- Example: rating 4 → "★★★★☆"

## Comment Truncation
- If comment length > 100 characters, truncated to 100 + "..."
- Full comment available only if admin expands (not implemented)

## No Actions
- Reviews tab is read-only — no delete, reply, or approve/reject
- No filtering or search
- No pagination (all reviews shown at once)

## Data Shape
```json
{
  "reviews": {
    "{reviewId}": {
      "userId": "user_uid",
      "userName": "User Name",
      "rating": 4,
      "comment": "Great food and fast delivery!",
      "timestamp": 1717000000000
    }
  }
}
```
