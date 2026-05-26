# Search Page — Code Logics

## Overview
Debounced search across outlets and menu items with filters.

## Key State
- `query` — search text from URL param `?q=`
- `results` — filtered outlets + menu items
- `activeFilter` — All / Outlets / Dishes tab

## Logic
- Reads `q` from URL params on mount
- Debounced filtering: outlets by name/tags/cuisine, dishes by name/category
- Filter tabs to switch between outlet results, dish results, or both
- Empty state when no results match

## Decisions
- Single search page serves hero search + nav search + cuisine taps
- Debounce avoids Firebase reads on every keystroke (filter is client-side after initial fetch)
- URL-driven query enables shareable search links
