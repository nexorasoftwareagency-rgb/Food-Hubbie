## Decisions.md

- Store and Delivery settings stored as separate Firebase paths — clean separation of concerns
- Validation on save only (not on input) — less disruptive to data entry
- Slabs as array of objects — flexible pricing model per km range
- Display tab is placeholder — future feature for visibility controls
- GSTIN/FSSAI validation allows empty (returns true if empty) — optional fields
- No image upload for store logo — future enhancement
