import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { initDatabase } from '../db';
import { ensurePhotosDirectory } from '../photos/storage';
import { ScreenPanel } from '../../components/ScreenPanel';

type DatabaseProviderProps = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const theme = useTheme();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setError(null);
        setReady(false);
        await initDatabase();
        try {
          await ensurePhotosDirectory();
        } catch {
          // Каталог фото не критичен для старта (например, на web).
        }
        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setReady(false);
          setError(
            err instanceof Error
              ? err.message
              : 'Не удалось инициализировать локальную базу',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ScreenPanel>
          <Text variant="titleMedium">Ошибка хранилища</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => setRetryKey((value) => value + 1)}>
            Повторить
          </Button>
        </ScreenPanel>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator animating size="large" />
        <Text style={styles.loadingText}>Подготовка локальных данных…</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    marginTop: 8,
  },
  errorText: {
    opacity: 0.8,
  },
});
