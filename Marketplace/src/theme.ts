// ─── Theme Engine ─────────────────────────────────────────────────────────────
// SaaS-ready: each business can receive a custom ThemeConfig at runtime.
// Currently uses the default Foodhubbie theme (Forest Green / Amber / Cream).
// Future: fetch from /api/business/:id/theme and call applyTheme(config).

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
  primary: "160 91% 20%",
  secondary: "38 92% 50%",
  background: "48 100% 97%",
  foreground: "160 50% 8%",
  card: "48 80% 98%",
  muted: "48 60% 92%",
  radius: "0.75rem",
  fontSans: "'Plus Jakarta Sans', sans-serif",
  fontHeading: "'Syne', sans-serif",
  brandName: "Foodhubbie",
  logoText: "FH",
};

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
