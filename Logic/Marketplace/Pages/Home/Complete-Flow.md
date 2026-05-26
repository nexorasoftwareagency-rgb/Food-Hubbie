# Home Page — Complete Flow

## User Journey

```
1. User lands on /
2. LocationContext checks permission:
   ├─ Granted → geolocation + Nominatim reverse geocode
   └─ Denied → "Detecting location..." placeholder
3. useEffect fires on mount:
   ├─ fetchOutlets() → all outlets → sortByDistance()
   ├─ getGlobalBestSellers(4) → top 4 best-sellers
   ├─ getGlobalRecommended(4) → top 4 recommended
   ├─ fetchGlobalReviews(6) → latest 6 reviews
   ├─ fetchAllMenuItems() → all dishes across all outlets
   └─ fetchCuisines() → cuisine list
4. Render sections:
   ├─ Location banner (mobile: Allow/Enable button)
   ├─ Hero with animated title + search form
   ├─ KPI strip (restaurants, open now, fastest delivery, top-rated)
   ├─ Cuisine horizontal scroll → tap navigates to /search?q={cuisine}
   ├─ Trending Now (FoodCard grid) → tap opens OutletDetails
   ├─ Quick Bites (FoodCard grid)
   ├─ "View All Restaurants" CTA → /outlets
   ├─ Universal Menu (all items grid)
   ├─ Customer Reviews
   └─ Pro Membership banner → toast "Coming soon"
5. Hero search → navigate to /search?q={input}
```
