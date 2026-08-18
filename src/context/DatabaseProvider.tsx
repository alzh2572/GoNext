import { ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { initDatabase } from '../db';
import { messageFromError } from '../i18n/errors';
import { ensurePhotosDirectory } from '../photos/storage';
import { ScreenPanel } from '../../components/ScreenPanel';

type DatabaseProviderProps = {
  children: ReactNode;
};

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
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
          setError(messageFromError(err, 'storage.initFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  return (
    <View style={styles.root}>
      {children}
      {error ? (
        <View
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ScreenPanel>
            <Text variant="titleMedium">{t('storage.errorTitle')}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              mode="contained"
              onPress={() => setRetryKey((value) => value + 1)}
            >
              {t('common.retry')}
            </Button>
          </ScreenPanel>
        </View>
      ) : null}
      {!ready && !error ? (
        <View
          style={[
            styles.overlay,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <ActivityIndicator animating size="large" />
          <Text style={styles.loadingText}>{t('storage.loading')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    marginTop: 8,
  },
  errorText: {
    opacity: 0.8,
  },
});
