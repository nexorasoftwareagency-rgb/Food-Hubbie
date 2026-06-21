# Foodhubbie Brand & Theme Tokens

> **Status:** Active (Phase 1 stabilization)  
> **Audience:** Designers, frontend developers  
> **Last updated:** 2026-06-04  
> **Format:** Code-Logics · Firebase-Rules · Database-Structure · Connecting-Nodes · Complete-Flows  
> **See also:** `docs/03-foundation/03-Config-and-Theme-Tokens.md` (canonical config doc) · `docs/00-master/00-ARCHITECTURE.md` (C4 model)

Defines how brand identity is expressed across every Foodhubbie app. The goal is
**a single source of truth** for color, typography, and per-tenant overrides — even though each app keeps its own visual identity.
---

## 1. The contract

`config/theme-tokens.js` exports a `TOKENS` object with three sections:

1. **Per-app default palettes** — `marketplace`, `rider`, `admin`, `supreme`.
2. **Per-tenant Marketplace overrides** — `tenants[businessId]`.
3. **A resolver** — `resolveMarketplaceTheme(businessId)` that returns the effective Marketplace palette for a given tenant (base + override merged).

Each app's theme module imports this file (or mirrors its values) and applies them at boot via the existing `applyTheme()` / CSS-variable mechanism.

---

## 2. Per-app palette matrix

| App | Primary | Secondary / CTA | Bg | Font |
|---|---|---|---|---|
| **Marketplace** | Forest Green `#065F46` (`160 91% 20%`) | Amber `#F59E0B` | Warm Cream `#FFFBEB` | Plus Jakarta Sans / Syne |
| **Rider** | Vibrant Orange `#FF5200` (`16 100% 50%`) | Red `#EF4444` | `#F4F6F8` | Outfit |
| **admin-dashboard (v2)** | matches Marketplace (green) | — | — | Plus Jakarta Sans |
| **SuperAdmin** | Slate `#0F172A` | Green CTA `#22C55E` | `#F8FAFC` | Satoshi / General Sans |
| **SupremeAdmin** | Slate `#0F172A` | Green CTA `#22C55E` | `#F8FAFC` | Satoshi / General Sans |

> The "per-app palette" decision (Phase 1) means we **keep the existing colors** but expose them through one shared token file. The previous situation — three different hardcoded color schemes scattered across CSS files, Tailwind config, and `theme.ts` — made any brand refresh a multi-PR exercise.

---

## 3. Token format

Colors are stored as **HSL `H S% L%` strings** (no `hsl(...)` wrapper) so each app can compose them however it needs:

- Tailwind 4 / shadcn: `hsl(var(--primary))` works directly.
- Plain CSS: `background: hsl(var(--primary));` (caller adds the wrapper).
- React inline style: `style={{ color: \`hsl(${TOKENS.marketplace.primary})\` }}`.

This format is already used by `Marketplace/src/index.css` and `Marketplace/src/theme.ts`.

---

## 4. Per-tenant overrides

Adding a new business's palette is a one-object-literal change:

```js
// config/theme-tokens.js
tenants: {
  business_roshani:  { primary: "160 91% 20%", ... },
  business_prashant: { primary: "16 100% 50%",  ... },
  business_acme:     { primary: "262 83% 58%",  // purple for the new tenant
                       secondary: "320 81% 60%",
                       brandName: "Acme Bites",
                       logoText: "AB" }
}
```

The Marketplace calls `applyTheme(theme)` after the outlet is resolved. `theme.ts` exposes `getThemeForTenant(businessId)` to make this one line:

```tsx
import { getThemeForTenant, applyTheme } from "@/theme";

useEffect(() => {
  if (outlet?.businessId) applyTheme(getThemeForTenant(outlet.businessId));
}, [outlet?.businessId]);
```

---

## 5. Migration status (per app)

| App | Imports from `config/theme-tokens.js` | Status |
|---|---|---|
| Marketplace | ✅ `Marketplace/src/theme.ts` | **Done (PR 1)** |
| RiderApp | ⏳ plan to import or hard-mirror | **Phase 2** — RiderApp lives in its own npm package; needs the shared workspace entry in `package.json` |
| admin-dashboard v2 | ⏳ plan to import | **Phase 2** |
| SuperAdmin | ⏳ plan to convert CSS vars | **Phase 2** |
| SupremeAdmin | ⏳ design-system only (no code) | **Phase 2** |

---

## 6. Anti-patterns (do not reintroduce)

- ❌ Hardcoding hex colors in component files.
- ❌ Defining the same palette in two places (e.g. `theme.ts` AND `tailwind.config.js`).
- ❌ Hardcoding the `FF` in `var(--primary)` — always use the raw `H S% L%` triple.
- ❌ Using emojis as icon stand-ins for primary brand colors.
