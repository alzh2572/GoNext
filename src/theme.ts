import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

export type AccentId =
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'rose'
  | 'red'
  | 'orange'
  | 'amber'
  | 'brown';

export const ACCENT_COLORS: {
  id: AccentId;
  light: string;
  dark: string;
  containerLight: string;
  containerDark: string;
}[] = [
  { id: 'green', light: '#1B5E4A', dark: '#8FCBB3', containerLight: '#C8E6D5', containerDark: '#1B5E4A' },
  { id: 'teal', light: '#00796B', dark: '#80CBC4', containerLight: '#B2DFDB', containerDark: '#004D40' },
  { id: 'blue', light: '#1565C0', dark: '#90CAF9', containerLight: '#BBDEFB', containerDark: '#0D47A1' },
  { id: 'indigo', light: '#3949AB', dark: '#9FA8DA', containerLight: '#C5CAE9', containerDark: '#1A237E' },
  { id: 'purple', light: '#6A1B9A', dark: '#CE93D8', containerLight: '#E1BEE7', containerDark: '#4A148C' },
  { id: 'rose', light: '#C2185B', dark: '#F48FB1', containerLight: '#F8BBD0', containerDark: '#880E4F' },
  { id: 'red', light: '#C62828', dark: '#EF9A9A', containerLight: '#FFCDD2', containerDark: '#B71C1C' },
  { id: 'orange', light: '#EF6C00', dark: '#FFCC80', containerLight: '#FFE0B2', containerDark: '#E65100' },
  { id: 'amber', light: '#F9A825', dark: '#FFE082', containerLight: '#FFECB3', containerDark: '#F57F17' },
  { id: 'brown', light: '#5D4037', dark: '#BCAAA4', containerLight: '#D7CCC8', containerDark: '#3E2723' },
];

export const DEFAULT_ACCENT: AccentId = 'green';

export function isAccentId(value: string): value is AccentId {
  return ACCENT_COLORS.some((item) => item.id === value);
}

export function getAccent(id: AccentId) {
  return ACCENT_COLORS.find((item) => item.id === id) ?? ACCENT_COLORS[0];
}

export function getPaperTheme(mode: ThemeMode, accentId: AccentId = DEFAULT_ACCENT): MD3Theme {
  const accent = getAccent(accentId);
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  if (mode === 'dark') {
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: accent.dark,
        primaryContainer: accent.containerDark,
        secondary: accent.dark,
        background: '#121212',
        surface: '#1E1E1E',
        error: '#CF6679',
      },
    };
  }

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: accent.light,
      primaryContainer: accent.containerLight,
      secondary: accent.light,
      background: '#F4F7F5',
      surface: '#FFFFFF',
      error: '#B00020',
    },
  };
}

export const cardShape = {
  borderRadius: 12,
  padding: 16,
} as const;
