import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '../src/context/DatabaseProvider';
import { theme } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <DatabaseProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </DatabaseProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
