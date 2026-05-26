# Businesses — Decisions

1. **Real-time listener on /businesses entire node**: Same pattern as Dashboard. All businesses loaded on every change regardless of filters.

2. **Client-side pagination (20 per page)**: All data loaded into memory, pagination done via JS array slicing. Not scalable to thousands of businesses.

3. **Search filters client-side**: filterBusinesses() uses string.includes() for matching. Case-insensitive but no fuzzy search or debouncing.

4. **Admin email loaded from /system/admins**: Separate read call to map business IDs to admin emails. Could be a nested field on the business itself.

5. **Commission stored on business**: Commission (percent + fixedFee) stored at /businesses/{bid}/commission. Simple but doesn't support per-outlet commission rates.

6. **Outlet admin credentials shown in plain text**: AdminPassDisplay field in edit modal shows password (likely placeholder or dummy). Security concern if real passwords are ever passed.
