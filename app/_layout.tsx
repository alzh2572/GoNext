import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '../src/context/DatabaseProvider';
import {
  ThemePreferenceProvider,
  useAppTheme,
} from '../src/context/ThemePreference';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { getPaperTheme } from '../src/theme';
import { StyleSheet } from 'react-native';

function ThemedApp() {
  const { mode, isDark, accentId } = useAppTheme();

  return (
    <PaperProvider theme={getPaperTheme(mode, accentId)}>
      <DatabaseProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </DatabaseProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <I18nProvider>
          <ThemePreferenceProvider>
            <ThemedApp />
          </ThemePreferenceProvider>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
