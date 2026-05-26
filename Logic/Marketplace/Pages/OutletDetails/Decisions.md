# OutletDetails Page — Decisions

| Decision | Rationale |
|---|---|
| **Dual routing (slug + ID)** | SaaS slug-based for new outlets; legacy ID-based for backward compat |
| **All categories pre-computed** | "All", "Recommended", "Best Sellers" always shown even if no dishes match |
| **Client-side search + filter** | Menu items already fetched; instant filtering |
| **Dietary filters as checkboxes** | Allows combining veg + spicy + bestseller simultaneously |
| **Skeleton loader during fetch** | Better UX than spinner for menu content |
| **`canOrder()` check** | Prevents adding to cart when outlet is closed/offline |
