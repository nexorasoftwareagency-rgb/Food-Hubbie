/**
 * ============================================================
 * FOODHUBBIE SAAS — Brand & Theme Tokens
 * ============================================================
 * Single source of truth for per-app brand palettes and the
 * multi-tenant white-label overrides.
 *
 * - Per-app defaults are consumed by each app's theme module.
 * - `tenants` lets a specific business override the Marketplace
 *   palette on the fly (consumed by applyTheme() in the
 *   Marketplace theme engine).
 *
 * Keep HSL `H S% L%` strings (no `hsl(...)` wrapper) so the
 * CSS engine in each app can compose them as needed.
 * ============================================================
 */

export const TOKENS = {
  // ─── Per-App Default Palettes ───────────────────────────
  marketplace: {
    brandName: "Foodhubbie",
    logoText: "FH",
    primary: "160 91% 20%",         // Forest Green #065F46
    secondary: "38 92% 50%",        // Amber #F59E0B
    background: "48 100% 97%",      // Warm Cream #FFFBEB
    foreground: "160 50% 8%",       // Dark Green-Black #0A2E1E
    card: "48 80% 98%",             // Off-white #FFFDF5
    muted: "48 60% 92%",            // Muted cream #F5ECD4
    destructive: "0 84% 60%",       // Red #EF4444
    radius: "0.75rem",
    fontSans: "'Plus Jakarta Sans', sans-serif",
    fontHeading: "'Syne', sans-serif",
  },
  rider: {
    brandName: "Foodhubbie Rider",
    logoText: "FH-R",
    primary: "16 100% 50%",         // Vibrant Orange #FF5200
    primaryDark: "16 100% 45%",     // #E64A00
    primaryLight: "20 100% 97%",    // #FFF5F1
    background: "210 17% 96%",      // #F4F6F8
    surface: "0 0% 100%",
    textMain: "215 25% 27%",        // Slate 800 #1E293B
    textMuted: "215 16% 47%",       // Slate 500 #64748B
    success: "158 64% 40%",         // Emerald #10B981
    info: "217 91% 60%",            // Blue #3B82F6
    warning: "38 95% 50%",          // Amber #F59E0B
    danger: "0 84% 60%",            // Red #EF4444
    radiusCard: "20px",
    radiusGlass: "16px",
    fontSans: "'Outfit', system-ui, sans-serif",
  },
  admin: {
    brandName: "Foodhubbie Pro",
    logoText: "PRO",
    primary: "222 47% 11%",        // Slate #0F172A
    secondary: "215 16% 47%",       // Slate #475569
    cta: "142 71% 45%",            // Green #22C55E
    background: "210 40% 98%",     // #F8FAFC
    surface: "0 0% 100%",
    text: "222 47% 11%",
    muted: "215 16% 47%",
    fontHeading: "'Satoshi', system-ui, sans-serif",
    fontBody: "'General Sans', system-ui, sans-serif",
  },
  supreme: {
    brandName: "Foodhubbie Supreme",
    logoText: "SA",
    primary: "222 47% 11%",
    cta: "142 71% 45%",
    background: "210 40% 98%",
    surface: "0 0% 100%",
    text: "222 47% 11%",
    muted: "215 16% 47%",
  },

  // ─── Per-Tenant Marketplace Overrides ───────────────────
  // Each entry is applied at runtime when a customer lands
  // on a /store/:slug route. Falls back to `marketplace` if
  // the businessId is not listed.
  tenants: {
    business_roshani: {
      primary: "160 91% 20%",
      secondary: "38 92% 50%",
      brandName: "Roshani Pizza",
      logoText: "RP",
    },
    business_prashant: {
      primary: "16 100% 50%",
      secondary: "38 92% 50%",
      brandName: "Prashant Pizza",
      logoText: "PP",
    },
  },
};

/**
 * Resolve a tenant's theme by businessId. Returns the base
 * Marketplace palette merged with any tenant overrides.
 */
export function resolveMarketplaceTheme(businessId) {
  const base = { ...TOKENS.marketplace };
  if (!businessId) return base;
  const override = TOKENS.tenants[businessId];
  if (!override) return base;
  return { ...base, ...override };
}

if (typeof window !== "undefined") {
  window.FOODHUBBIE_THEME_TOKENS = TOKENS;
  window.resolveFoodhubbieTheme = resolveMarketplaceTheme;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TOKENS, resolveMarketplaceTheme };
}
