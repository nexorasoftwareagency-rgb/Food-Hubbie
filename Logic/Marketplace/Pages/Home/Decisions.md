# Home Page — Decisions

| Decision | Rationale |
|---|---|
| **All data fetched in one `useEffect`** | Single load on mount/coords change; avoids multiple waterfalls |
| **`sortByDistance` at fetch time** | Location-aware sorting without re-fetching |
| **Cuisine grid links to search** | Reuses existing search page instead of separate cuisine page |
| **Framer Motion everywhere** | Animations on scroll into view for engagement |
| **Global menu from all outlets** | Shows breadth of marketplace; encourages exploration |
| **Reviews from all outlets** | Social proof on landing page |
| **Pro Membership is toast-only** | Feature not implemented; toast indicates coming soon |
| **Location not auto-requested** | User must tap Allow; respects privacy (LocationContext behavior) |
