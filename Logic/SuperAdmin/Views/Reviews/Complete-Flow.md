# Reviews Tab — Complete Flow

## Page Load Sequence
```
1. Admin navigates to "Ratings & Reviews" tab
2. loadReviews() called:
   ├─ db.ref('businesses').once('value', (snap) => {
   │   ├─ Iterate all businesses → outlets → reviews
   │   ├─ Aggregate all reviews
   │   ├─ Compute: avg rating, total count, positive %, negative %
   │   ├─ Compute outlet averages
   │   ├─ renderOutletScoreboard(): top 5 + bottom 5
   │   ├─ renderReviewsList(): show all / filtered
   │   └─ lucide.createIcons()
   │   })
```

## Filter Flow
```
1. Admin selects filter from #reviewFilter dropdown
2. loadReviews() re-called with filter:
   ├─ "all" → show all reviews
   ├─ "5" → only 5★
   ├─ "4" → only 4★
   ├─ "3" → only 3★
   └─ "low" → only 1-2★
3. Review list re-rendered with filter
```
