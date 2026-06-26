import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#172033',
    textSecondary: '#667085',
    textMuted: '#8A94A6',
    background: '#F7F9FC',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F5F9',
    backgroundElement: '#EDF2F7',
    backgroundSelected: '#E1E8F0',
    border: '#D8E0EA',
    primary: '#155EEF',
    primaryPressed: '#0F49C6',
    primarySoft: '#EAF1FF',
    primaryText: '#FFFFFF',
    success: '#067647',
    successSoft: '#E7F6EF',
    warning: '#B54708',
    warningSoft: '#FFF4E5',
    danger: '#B42318',
    dangerSoft: '#FDECEC',
    tabInactive: '#8A94A6',
  },
  dark: {
    text: '#F5F7FA',
    textSecondary: '#BAC2D0',
    textMuted: '#8E98A8',
    background: '#10141D',
    surface: '#171C27',
    surfaceMuted: '#202736',
    backgroundElement: '#202736',
    backgroundSelected: '#2B3445',
    border: '#303A4C',
    primary: '#6EA8FF',
    primaryPressed: '#4F8CEF',
    primarySoft: '#172A4E',
    primaryText: '#07111F',
    success: '#58D68D',
    successSoft: '#143829',
    warning: '#F7B955',
    warningSoft: '#3B2B13',
    danger: '#FF8A80',
    dangerSoft: '#401D1B',
    tabInactive: '#8E98A8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemePalette = (typeof Colors)[keyof typeof Colors];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 18,
  pill: 999,
} as const;

export const Typography = {
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
} as const;

export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#172033',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
