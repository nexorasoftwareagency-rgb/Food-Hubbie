# Admin Dashboard — index.html Overview

## Purpose
Vite HTML entry point for the Admin Dashboard SPA.

## Structure
- `<div id="root">` — React mount point
- `<script type="module" src="/src/main.jsx">` — Vite module entry
- Title: `"FoodHubbie Admin"`
- Favicon: `/favicon.svg`
- No external CDN, no Google Fonts, no inline scripts

## Notes
- Minimal boilerplate — Vite injects CSS and bundled scripts automatically
- No preload/prefetch hints — Vite handles code splitting
- No meta tags beyond charset and viewport
