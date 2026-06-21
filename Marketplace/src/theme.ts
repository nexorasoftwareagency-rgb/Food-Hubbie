// ─── Theme Engine ─────────────────────────────────────────────────────────────
// SaaS-ready: each business can receive a custom ThemeConfig at runtime.
// Tokens are sourced from the shared brand registry at
// `config/theme-tokens.js` so per-app palettes stay in sync with the
// central design source. Multi-tenant overrides are resolved by
// `resolveMarketplaceTheme(businessId)`.

import { TOKENS, resolveMarketplaceTheme } from "../../config/theme-tokens.js";

export type ThemeConfig = {
  primary: string;
  secondary: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  radius: string;
  fontSans: string;
  fontHeading: string;
  brandName: string;
  logoText: string;
};

export const defaultTheme: ThemeConfig = {
  ...TOKENS.marketplace,
};

/**
 * Resolve the theme for a given tenant (businessId).
 * Falls back to the default Marketplace palette when the
 * business has no override registered.
 */
export function getThemeForTenant(businessId: string | null | undefined): ThemeConfig {
  const resolved = resolveMarketplaceTheme(businessId ?? "");
  return { ...defaultTheme, ...resolved };
}

/**
 * Apply a ThemeConfig by writing CSS custom properties to :root.
 * Call this once on app boot (or when a business slug changes in SaaS mode).
 */
export function applyTheme(config: Partial<ThemeConfig> = {}): void {
  const theme = { ...defaultTheme, ...config };
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--foreground", theme.foreground);
  root.style.setProperty("--card", theme.card);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--radius", theme.radius);
  root.style.setProperty("--app-font-sans", theme.fontSans);
  root.style.setProperty("--app-font-heading", theme.fontHeading);
}

export const currentTheme = defaultTheme;
