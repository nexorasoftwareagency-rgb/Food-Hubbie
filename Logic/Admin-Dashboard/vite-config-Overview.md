# Admin Dashboard — vite.config.js Overview

## Purpose
Vite build configuration for the Admin Dashboard.

## Plugins
| Plugin | Purpose |
|---|---|
| `@vitejs/plugin-react` | React Fast Refresh + JSX transform |
| `@tailwindcss/vite` | Tailwind CSS v4 processing |

## Key Config
- **`jsxRuntime: "classic"`** — Uses the classic JSX transform (`React.createElement`) instead of the automatic `jsx-runtime`. Relevant when upgrading React or using libraries that expect `React` in scope.
- No `resolve.alias` — imports use relative paths throughout
- No proxy — API calls go directly to Firebase
- No `build.rollupOptions` — default Vite chunking

## Notes
- Tailwind v4 is used via Vite plugin (not PostCSS)
- No TypeScript plugin — the dashboard is plain JSX
