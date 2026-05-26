# Outlets Tab — Important Points

1. **Profile load is expensive**: Reads outlet + orders + reviews for full analytics (Firebase cost per read)
2. **Password in plaintext**: Admin password stored and editable in clear text (known concern)
3. **Search debounce**: `oninput` fires on every keystroke — no debounce implemented, could lag with 100+ outlets
4. **Slug collision**: Edit modal does NOT check slug uniqueness before update
5. **Outlet ID immutable**: `id` and `slug` fields shown but not editable (primary key)
6. **Modal backdrops**: Profile and edit modals use `backdrop-blur` CSS class
7. **Profile modal closes via** `hideOutletProfile()` — sets `#outletProfileModal` class to `hidden`
