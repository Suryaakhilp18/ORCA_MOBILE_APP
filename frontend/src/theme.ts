// ORCA design tokens — Luxury Marine Command Console (Dual Dark/Light Theme with Glassmorphism).
// Moody teal-and-charcoal dark palette & frosted pearl-and-teal light palette.

export const darkColors = {
  // 1. Dark Surfaces & Backgrounds
  bg: "#111417", // --bg-charcoal
  bgCharcoal: "#111417",
  bgTealDeep: "#0F3D3E", // --bg-teal-deep
  surface: "#181C20", // Glassmorphic charcoal panel
  surfaceSecondary: "#111417",
  surfaceTertiary: "#1E2428",
  surfaceInverse: "#0D1013",
  surfaceWhite: "#FFFFFF",
  surfaceGlass: "rgba(255, 255, 255, 0.08)", // --surface-glass
  badgeBg: "rgba(255, 255, 255, 0.15)", // --badge-bg
  glassCardBg: "rgba(24, 28, 32, 0.82)",

  // 2. Text & Typography
  onSurface: "#FFFFFF", // --text-primary
  textPrimary: "#FFFFFF",
  onSurfaceSecondary: "#B8C2C2", // --text-secondary
  onSurfaceTertiary: "#9AA5A5",
  textSecondary: "#B8C2C2",
  textMutedOnLight: "#6B7280",
  onSurfaceInverse: "#FFFFFF",

  // 3. Brand & Accent Highlights
  brand: "#1FA6A0", // --teal-primary
  tealPrimary: "#1FA6A0",
  tealGlow: "#2DBFB8", // --teal-glow
  onBrand: "#FFFFFF",
  accentSoft: "#2DBFB8",

  // 4. Tactical Marine HUD Accents
  neonCyan: "#1FA6A0",
  neonEmerald: "#1FA6A0",
  neonGold: "#F59E0B",
  neonRed: "#EF4444",

  success: "#1FA6A0",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#111417",
  error: "#EF4444",
  onError: "#FFFFFF",

  data: "#2DBFB8",
  dataBlue: "#2DBFB8",
  dataCyan: "#1FA6A0",

  // 5. Borders & Dividers
  border: "rgba(255, 255, 255, 0.1)", // --divider
  borderStrong: "rgba(255, 255, 255, 0.18)",
  borderCyan: "rgba(31, 166, 160, 0.35)",
  borderTeal: "rgba(31, 166, 160, 0.35)",
  borderGlass: "rgba(31, 166, 160, 0.28)",
  divider: "rgba(255, 255, 255, 0.1)",
  muted: "#9AA5A5",
  brandGlow: "#2DBFB8",
};

export const lightColors: typeof darkColors = {
  // 1. Light Frosted Surfaces & Backgrounds
  bg: "#F0F4F8", // Soft coastal pearl/mist
  bgCharcoal: "#E2E8F0",
  bgTealDeep: "#134E4A",
  surface: "#FFFFFF", // Frosted glass card
  surfaceSecondary: "#F0F4F8",
  surfaceTertiary: "#F1F5F9",
  surfaceInverse: "#F1F5F9",
  surfaceWhite: "#FFFFFF",
  surfaceGlass: "rgba(255, 255, 255, 0.92)",
  badgeBg: "rgba(31, 166, 160, 0.14)",
  glassCardBg: "rgba(255, 255, 255, 0.92)",

  // 2. Text & Typography
  onSurface: "#0F171A", // Razor-sharp deep charcoal
  textPrimary: "#0F171A",
  onSurfaceSecondary: "#475569", // Sophisticated slate
  onSurfaceTertiary: "#64748B",
  textSecondary: "#475569",
  textMutedOnLight: "#6B7280",
  onSurfaceInverse: "#0F171A",

  // 3. Brand & Accent Highlights
  brand: "#0D9488", // Crisp coastal teal
  tealPrimary: "#0D9488",
  tealGlow: "#0F766E",
  brandGlow: "#14B8A6",
  onBrand: "#FFFFFF",
  accentSoft: "#14B8A6",

  // 4. Tactical Marine HUD Accents
  neonCyan: "#0D9488",
  neonEmerald: "#0D9488",
  neonGold: "#D97706",
  neonRed: "#DC2626",

  success: "#0D9488",
  onSuccess: "#FFFFFF",
  warning: "#D97706",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",

  data: "#0D9488",
  dataBlue: "#0284C7",
  dataCyan: "#0D9488",

  // 5. Borders & Dividers
  border: "rgba(15, 61, 62, 0.12)", // Frosted glass hairline
  borderStrong: "rgba(15, 61, 62, 0.22)",
  borderCyan: "rgba(13, 148, 136, 0.35)",
  borderTeal: "rgba(13, 148, 136, 0.35)",
  borderGlass: "rgba(15, 61, 62, 0.16)",
  divider: "rgba(15, 61, 62, 0.1)",
  muted: "#64748B",
};

export const colors = darkColors;

export const getTheme = (isDark = true) => (isDark ? darkColors : lightColors);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = { sm: 8, md: 10, lg: 14, xl: 18, pill: 999 };

export const type = { xs: 11, sm: 12, base: 14, lg: 16, xl: 20, xxl: 24 };

export const fonts = { mono: "SpaceMono" };

// Verdict color mapping used across cards/badges.
export const verdictColor = (v?: string | null, isDark = true) => {
  const c = getTheme(isDark);
  if (v === "SAFE") return { bg: c.brand, fg: c.onBrand };
  if (v === "UNSAFE") return { bg: c.error, fg: c.onError };
  if (v === "CAUTION") return { bg: c.warning, fg: c.onWarning };
  return { bg: c.surfaceTertiary, fg: c.onSurface };
};

// Alert-severity color mapping
export const severityColor = (s?: string | null, isDark = true) => {
  const c = getTheme(isDark);
  if (s === "critical") return { bg: c.error, fg: c.onError };
  if (s === "warning") return { bg: c.warning, fg: c.onWarning };
  return { bg: c.brand, fg: c.onBrand };
};
