import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '../src/context/DatabaseProvider';
import {
  ThemePreferenceProvider,
  useAppTheme,
} from '../src/context/ThemePreference';
import { getPaperTheme } from '../src/theme';

function ThemedApp() {
  const { mode, isDark } = useAppTheme();

  return (
    <PaperProvider theme={getPaperTheme(mode)}>
      <DatabaseProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </DatabaseProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemePreferenceProvider>
        <ThemedApp />
      </ThemePreferenceProvider>
    </SafeAreaProvider>
  );
}
