## Decisions.md

- Boolean → numeric stock migration automatic — no manual data migration needed; old outlets fix themselves on page load
- `threshold` defaults to 5 in both migration and new form — sensible default for most dishes
- Sizes stored as object `{Name: Price}` (not array) — Firebase prefers objects for variable-length data
- Addons as JSON textarea — simple dev-friendly input; could be improved with structured form
- No image upload in this menu page — only URL input; image upload is in sections/Menu.jsx
