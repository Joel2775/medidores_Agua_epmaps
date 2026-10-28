export const COLORS = {
  primary: '#D92534',
  electricBlue: '#0511F2',
  deepBlue: '#263973',
  secondaryBlue: '#117DBF',
  gold: '#D9B64E',
  background: '#F4F6FC',
  surface: '#FFFFFF',
  surfaceSecondary: '#EEF1FA',
  textPrimary: '#263973',
  textSecondary: '#687493',
  textMuted: '#929BB2',
  border: '#E1E6F2',
  success: '#2E9D75',
  error: '#D92534',
} as const;

export const RADIUS = {
  small: 12,
  medium: 18,
  large: 24,
  extraLarge: 30,
  pill: 999,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  huge: 40,
} as const;

export const SHADOWS = {
  soft: {
    shadowColor: "#263973",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: "#263973",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  primary: {
    shadowColor: "#0511F2",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  accent: {
    shadowColor: "#D92534",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
} as const;

export const TYPOGRAPHY = {
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: COLORS.textMuted,
  },
} as const;
