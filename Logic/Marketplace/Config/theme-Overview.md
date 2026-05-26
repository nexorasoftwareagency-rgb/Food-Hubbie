# Marketplace Config — theme.ts Overview

## Purpose
Runtime theme engine using CSS custom properties. SaaS-ready for per-business theming.

## Default Theme (Foodhubbie)
| Property | Value | Description |
|---|---|---|
| `--primary` | `160 91% 20%` | Forest Green |
| `--secondary` | `38 92% 50%` | Amber |
| `--background` | `48 100% 97%` | Cream |
| `--foreground` | `160 50% 8%` | Dark green |
| `--card` | `48 80% 98%` | Light cream |
| `--muted` | `48 60% 92%` | Muted cream |
| `--radius` | `0.75rem` | Border radius |
| `--app-font-sans` | `'Plus Jakarta Sans', sans-serif` | Body font |
| `--app-font-heading` | `'Syne', sans-serif` | Heading font |

## Key Function
`applyTheme(config: Partial<ThemeConfig> = {})`:
- Merges provided config with `defaultTheme`
- Writes HSL values as CSS custom properties on `document.documentElement`
- Called in `main.tsx` before app render
- Future: `applyTheme(businessTheme)` when business slug changes

## Points
- HSL values (no hex/rgb) for dynamic color manipulation
- Fonts served via Google Fonts CDN in index.html
- No dark mode toggle — theme is always light
- SaaS multi-tenancy not yet implemented (fetch from API)
