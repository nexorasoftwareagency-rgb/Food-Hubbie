## Points.md

- Auto-migration runs on EVERY dishes data change — idempotent but causes unnecessary writes if data hasn't changed
- `handleSave` parses addons JSON with `JSON.parse(f.addons||"null")` — throws if invalid JSON, caught by generic try/catch
- Form uses individual useState for each field (via `f` object) — single state object pattern
- No veg/best-seller toggles in App.jsx MenuPage (but exist in sections/Menu.jsx and database structure)
- Stock badge in grid shows "Out of Stock" for exactly 0, "Low Stock" for ≤threshold — but no count shown for healthy stock (unlike POS which shows ⚠ N badge)
- Category field stores category ID (not name) — must match categories node key
- Size list UI uses Add/Remove buttons with array state — stores as object for Firebase compatibility
