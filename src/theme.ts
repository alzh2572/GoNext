import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

export type ThemeMode = 'light' | 'dark';

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1B5E4A',
    primaryContainer: '#C8E6D5',
    secondary: '#3D6B5A',
    background: '#F4F7F5',
    surface: '#FFFFFF',
    error: '#B00020',
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#8FCBB3',
    primaryContainer: '#1B5E4A',
    secondary: '#A8C4B8',
    background: '#121212',
    surface: '#1E1E1E',
    error: '#CF6679',
  },
};

export function getPaperTheme(mode: ThemeMode): MD3Theme {
  return mode === 'dark' ? darkTheme : lightTheme;
}

export const cardShape = {
  borderRadius: 12,
  padding: 16,
} as const;
