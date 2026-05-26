# Businesses Tab — Decisions

## Design Decisions
1. **Separate tab from dashboard** — Dashboard has condensed business list; this tab provides full CRUD with pagination
2. **Admin email denormalized lookup** — `system/admins` read once on load, merged client-side with business list
3. **Pagination** — 10 per page prevents DOM overload with many partners
4. **Provision New button** — Quick link to onboarding form for creating new partners
5. **Commission model display** — Shows partner's current commission rate for quick reference
