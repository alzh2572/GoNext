import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
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

export const cardSurface = {
  backgroundColor: 'rgba(255,255,255,0.92)',
  borderRadius: 12,
  padding: 16,
} as const;
