export type HiOSTheme = {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceStrong: string;
  foreground: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  border: string;
  glowPrimary: string;
  glowSecondary: string;
  buttonText: string;
  success: string;
};

const DARK_THEME: HiOSTheme = {
  isDark: true,
  background: "#211c23",
  surface: "rgba(255,250,244,0.055)",
  surfaceStrong: "#3b3036",
  foreground: "#fffaf4",
  muted: "rgba(255,250,244,0.66)",
  faint: "rgba(255,250,244,0.44)",
  accent: "#f5c59a",
  accentSoft: "rgba(245,197,154,0.16)",
  border: "rgba(255,250,244,0.16)",
  glowPrimary: "rgba(201, 132, 76, 0.45)",
  glowSecondary: "rgba(66, 83, 82, 0.34)",
  buttonText: "#2b2020",
  success: "#a9d4b5",
};

const LIGHT_THEME: HiOSTheme = {
  isDark: false,
  background: "#f4eee8",
  surface: "rgba(255,255,255,0.72)",
  surfaceStrong: "#fffaf4",
  foreground: "#2c2529",
  muted: "rgba(44,37,41,0.66)",
  faint: "rgba(44,37,41,0.46)",
  accent: "#a65f3d",
  accentSoft: "rgba(166,95,61,0.12)",
  border: "rgba(88,67,58,0.18)",
  glowPrimary: "rgba(213, 157, 112, 0.38)",
  glowSecondary: "rgba(177, 194, 194, 0.38)",
  buttonText: "#fffaf4",
  success: "#39734b",
};

export function getHiOSTheme(colorScheme: "light" | "dark" | null | undefined) {
  return colorScheme === "dark" ? DARK_THEME : LIGHT_THEME;
}
