import { useThemeStore, ThemeId } from '@/store/theme.store';

// ─── Dark palette (Lime) ──────────────────────────────────────────────────────

export const darkColors = {
  background: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1C1C1C',
  surfaceBorder: '#2A2A2A',

  primary: '#AAFF00',
  primaryDim: 'rgba(170,255,0,0.15)',
  primaryHover: '#C5FF4D',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  textTertiary: '#6B6B6B',
  textDisabled: '#404040',
  textInverse: '#0A0A0A',

  chest: '#EF4444', back: '#3B82F6', shoulders: '#8B5CF6',
  biceps: '#06B6D4', triceps: '#F59E0B', legs: '#22C55E',
  core: '#EC4899', cardio: '#F97316',
};

// ─── Orange Dark palette ──────────────────────────────────────────────────────

export const orangeColors = {
  background: '#0E0E0E',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  surfaceBorder: '#303030',

  primary: '#F97316',
  primaryDim: 'rgba(249,115,22,0.15)',
  primaryHover: '#FB923C',

  success: '#22C55E',
  warning: '#FBBF24',
  error: '#EF4444',
  info: '#3B82F6',

  textPrimary: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textTertiary: '#686868',
  textDisabled: '#404040',
  textInverse: '#0E0E0E',

  chest: '#EF4444', back: '#3B82F6', shoulders: '#8B5CF6',
  biceps: '#06B6D4', triceps: '#F59E0B', legs: '#22C55E',
  core: '#EC4899', cardio: '#F97316',
};

// ─── Midnight / Stakent-inspired navy palette ─────────────────────────────────

export const midnightColors = {
  background: '#0C0D1A',       // near-black with navy tint — Stakent page bg
  surface: '#10111A',          // Stakent card bg
  surfaceElevated: '#161726',  // inner elevated card
  surfaceBorder: '#1E1F30',    // subtle border

  primary: '#7B6CF0',          // soft lavender-purple — Stakent gradient accent
  primaryDim: 'rgba(123,108,240,0.15)',
  primaryHover: '#9B8BF5',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  textPrimary: '#E8EAFF',      // cool blue-white
  textSecondary: '#7B85A8',    // muted slate-blue
  textTertiary: '#3D4468',
  textDisabled: '#252845',
  textInverse: '#0C0D1A',

  chest: '#EF4444', back: '#3B82F6', shoulders: '#7B6CF0',
  biceps: '#06B6D4', triceps: '#F59E0B', legs: '#22C55E',
  core: '#EC4899', cardio: '#F97316',
};

// ─── Pink / Giles palette ─────────────────────────────────────────────────────

export const pinkColors = {
  background: '#0D0D0D',
  surface: '#181818',
  surfaceElevated: '#222222',
  surfaceBorder: '#2E2E2E',

  primary: '#F020A0',
  primaryDim: 'rgba(240,32,160,0.15)',
  primaryHover: '#F550B8',

  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  textTertiary: '#6B6B6B',
  textDisabled: '#404040',
  textInverse: '#0D0D0D',

  chest: '#EF4444', back: '#3B82F6', shoulders: '#8B5CF6',
  biceps: '#06B6D4', triceps: '#F59E0B', legs: '#22C55E',
  core: '#EC4899', cardio: '#F97316',
};

// ─── Azure / Shopeers-inspired light palette ──────────────────────────────────

export const azureColors = {
  background: '#F0F4F9',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  surfaceBorder: '#E2E8F0',

  primary: '#2563EB',
  primaryDim: 'rgba(37,99,235,0.10)',
  primaryHover: '#3B82F6',

  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#0284C7',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',

  chest: '#DC2626', back: '#2563EB', shoulders: '#7C3AED',
  biceps: '#0284C7', triceps: '#D97706', legs: '#16A34A',
  core: '#DB2777', cardio: '#EA580C',
};

// ─── Light palette ────────────────────────────────────────────────────────────

export const lightColors = {
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceElevated: '#EDF0F4',
  surfaceBorder: '#DDE1E7',

  primary: '#7ACC00',
  primaryDim: 'rgba(122,204,0,0.12)',
  primaryHover: '#96E000',

  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  textPrimary: '#111827',
  textSecondary: '#374151',
  textTertiary: '#9CA3AF',
  textDisabled: '#D1D5DB',
  textInverse: '#FFFFFF',

  chest: '#EF4444', back: '#3B82F6', shoulders: '#8B5CF6',
  biceps: '#06B6D4', triceps: '#D97706', legs: '#16A34A',
  core: '#DB2777', cardio: '#EA580C',
};

export type ColorPalette = typeof darkColors;

const PALETTE_MAP: Record<ThemeId, ColorPalette> = {
  dark: darkColors,
  orange: orangeColors,
  light: lightColors,
  pink: pinkColors,
  azure: azureColors,
  midnight: midnightColors,
};

// Backward-compat alias used by files not yet migrated to useColors()
export const Colors = darkColors;

export function getColors(isDark: boolean): ColorPalette {
  return isDark ? darkColors : lightColors;
}

export function useColors(): ColorPalette {
  const theme = useThemeStore(s => s.theme);
  return PALETTE_MAP[theme] ?? darkColors;
}

// ─── Spacing / Typography / Radius / Shadows ──────────────────────────────────

export const Spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24,
  '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
};

export const Radius = {
  sm: 6, md: 10, lg: 14, xl: 18, '2xl': 24, full: 9999,
};

// Extra bottom padding so content clears the floating tab bar pill
export const TAB_BAR_PADDING = 130;

export const Typography = {
  xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24,
  '2xl': 28, '3xl': 34, '4xl': 40,
  regular: '400' as const, medium: '500' as const,
  semibold: '600' as const, bold: '700' as const, extrabold: '800' as const,
};

export const Shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  glow: { shadowColor: '#AAFF00', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
};
