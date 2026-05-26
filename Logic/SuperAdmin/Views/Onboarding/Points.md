# Onboarding Tab — Important Points

1. **secondaryAuth.createUser()** — Creates Firebase Auth account without affecting current admin session
2. **No rollback on failure** — If step 4 succeeds but step 5 fails, orphaned data remains
3. **Admin password visible** — `#adminPass` input value is accessible in DOM after creation
4. **Slug collision** — Caught by `update()` — if slug exists, the write silently overwrites
5. **Commission default** — New businesses get 10% commission by default; must be edited after
6. **Category template** — `defaultCategories` is a static object in main.js
7. **Real-time listener cleanup** — Listener removed on tab switch (via `off()`)
8. **Audit log action types**: `PARTNER_APPROVED`, `PARTNER_REJECTED`, `ECOSYSTEM_INITIALIZE` (manual provisioning)
