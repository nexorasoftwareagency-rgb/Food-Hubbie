# Outlets Page — Decisions

| Decision | Rationale |
|---|---|
| **Client-side sort/filter** | All outlets already in memory; instant UI without extra Firebase reads |
| **Distance sort requires location** | Best UX; falls back to name sort without coords |
| **Veg-only filter** | Common dietary filter for food delivery apps |
| **No pagination** | City-level outlet count is manageable for single render |
