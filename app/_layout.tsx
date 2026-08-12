import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '../src/context/DatabaseProvider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <DatabaseProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </DatabaseProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
