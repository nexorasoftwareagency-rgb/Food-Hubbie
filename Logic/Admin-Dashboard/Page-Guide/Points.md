# Points / Gotchas: Page Guide Module

## UI
- **Modal is not dismissible via backdrop click** — must click × or close button (accessibility)
- **Lucide icons re-rendered** on modal open via `lucide.createIcons({ root: modal })`
- **Steps are static** — no dynamic content based on actual data

## Performance
- **No Firebase reads** — all content is hardcoded
- **No state management** — purely render-on-open

## Accessibility
- **`aria-hidden`** toggled on modal open/close
- **Escape key** closes modal (standard modal behavior)
- **Focus trap** — not yet implemented (v2)

## Content maintenance
- Guide content must be updated when pages change (new features, renamed tabs)
- Currently maintained manually in `page-guide.js`
