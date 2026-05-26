# Shared Components — Design Decisions

## Firebase Config in Source Code
- Stored directly in `firebase.js` (not environment variables)
- Trade-off: convenience over security for internal admin tool

## Module-Level Globals Over React Context
- `_bizId` / `_outletId` globals + `Outlet()` function instead of React Context
- Avoids prop drilling across 18 pages without adding a state management library

## Monolithic App.jsx
- All 18 pages defined inline inside App.jsx
- `sections/` directory exists but is unused by App.jsx
- Trade-off: rapid development velocity over modular architecture

## No React Router
- Simple page ID + PAGES object lookup
- State persisted in localStorage
- No URL-based routing, no deep linking, no shareable URLs

## Module-Level Const Functions
- All helpers defined as `const fn = ...` at module level (not inside App component)
- Avoids re-creation on every render
- Works because functions don't depend on component state

## Legacy Data Format Handling
- `orderItemsCount()` and `orderItemsText()` handle 3 formats: `cart[]`, `items{}`, scalar
- Legacy support for different Firebase data shapes across migrations

## CSS Variables for Dark Mode
- Manual `--bg`, `--sideBg`, `--textCol` style vars
- No Tailwind `dark:` modifier usage

## Toast Implementation
- Fixed-position `div` at bottom-center
- 3.5s auto-dismiss timeout
- No external toast library
