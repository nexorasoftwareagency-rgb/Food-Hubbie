# Shared Components — Points & Observations

## Technical Debt
- 18 pages in App.jsx duplicate the 18 section files in `sections/` directory — should consolidate into one source of truth
- No React Context for outlet info — relies on module-level mutable globals which can cause stale reads across re-renders

## Typing
- No TypeScript — all component props are untyped
- Runtime errors possible from incorrect prop types

## CSS Architecture
- Mix of three styling approaches: inline `style` objects, `App.css` classes, and Tailwind utility classes
- No consistent styling strategy

## Navigation Limitations
- Uses `localStorage` instead of URL routing
- No deep-linking capability
- No shareable URLs
- Browser back/forward buttons don't navigate

## Auth
- No session persistence beyond Firebase default
- No refresh token handling
- Page refresh with expired session shows loading then login

## CSV Export
- `downloadCSV` uses BOM-less CSV
- May break in Excel for non-ASCII characters (Indian rupee symbol, etc.)

## Code Duplication
- `stockStatus()` and validation functions (`validateGSTIN`, `validateFSSAI`, `validateCoords`) are duplicated in both App.jsx and `utils/` module files
- Inline shared components in App.jsx duplicate the 13 standalone component files in `components/`
