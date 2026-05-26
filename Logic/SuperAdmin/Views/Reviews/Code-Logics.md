# Reviews Tab — Code Logics

## Purpose
Platform-wide ratings and reviews management — outlet scoreboard, review filtering, trend analysis.

## Key Functions (main.js)
| Function | Trigger | Action |
|---|---|---|
| `loadReviews()` | Tab load | Aggregate reviews across all outlets |
| `renderOutletScoreboard()` | Data ready | Top-rated and low-rated outlet lists |
| `renderReviewsList()` | Data ready | Filtered review list |

## Data Sources
| Path | Operation | Purpose |
|---|---|---|
| `businesses/{bid}/outlets/{oid}/reviews` | `once('value')` | All reviews |

## Metric Cards (4)
| ID | Computation |
|---|---|
| `#avgPlatformRating` | Average of all ratings across platform |
| `#totalReviewCount` | Total review count |
| `#positiveReviewPct` | % of reviews with 4-5 stars |
| `#negativeReviewPct` | % of reviews with 1-2 stars |

## Outlet Scoreboard
```
Top Rated Outlets:
  ├─ Sort outlets by average rating (descending)
  └─ Show top 5 with rating badges

Low Rated / Flagged:
  ├─ Sort outlets by average rating (ascending)
  └─ Show bottom 5 or outlets with avg < 3.0
```

## Review List
```
Each review card shows:
  ├─ Customer name
  ├─ Outlet name
  ├─ Star rating (1-5)
  ├─ Review text
  ├─ Date
  └─ Filter: All / 5★ / 4★ / 3★ / 1-2★ (Critical)
```

## Edge Cases
- **No reviews** → "No reviews yet" empty state, metrics show 0 or "—"
- **Outlet with no reviews** → Not included in scoreboard
- **All 5-star reviews** → Negative pct = 0%, "No flagged outlets"
- **Very low reviews** → Single review could skew platform average
