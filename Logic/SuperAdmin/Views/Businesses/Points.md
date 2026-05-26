# Businesses Tab — Important Points

1. **Admin mapping**: Admin lookup by matching admin.uid or admin metadata stored on business — relies on convention
2. **No edit functionality**: Tab displays business info but no inline editing (commission etc edited elsewhere)
3. **Pagination state**: PAGINATION.businesses preserved during tab switch, reset on refresh
4. **Provision New** navigates to onboarding tab (not a modal)
5. **Table sort**: No built-in sort — order depends on Firebase key order
