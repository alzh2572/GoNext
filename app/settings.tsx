import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Divider, SegmentedButtons, Text } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';
import { ScreenPanel } from '../components/ScreenPanel';
import { useAppTheme } from '../src/context/ThemePreference';
import { placesRepository, resetAllData, tripsRepository } from '../src/db';
import { changeAppLanguage, isAppLanguage, type AppLanguage } from '../src/i18n';
import { messageFromError } from '../src/i18n/errors';
import { clearPhotosDirectory } from '../src/photos/storage';
import type { ThemeMode } from '../src/theme';
import { AccentColorPicker } from '../components/AccentColorPicker';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { mode, setMode, accentId, setAccentId } = useAppTheme();
  const [placesCount, setPlacesCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const language = isAppLanguage(i18n.language) ? i18n.language : 'ru';

  const refreshCounts = useCallback(async () => {
    try {
      const [places, trips] = await Promise.all([
        placesRepository.countPlaces(),
        tripsRepository.countTrips(),
      ]);
      setPlacesCount(places);
      setTripsCount(trips);
    } catch (error) {
      setStatus(messageFromError(error, 'settings.readFailed'));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshCounts();
    }, [refreshCounts]),
  );

  const runReset = async () => {
    try {
      setBusy(true);
      setStatus(null);
      await resetAllData();
      await clearPhotosDirectory();
      await refreshCounts();
      setStatus(t('settings.resetDone'));
    } catch (error) {
      setStatus(messageFromError(error, 'settings.resetFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      void runReset();
      return;
    }

    Alert.alert(t('settings.resetConfirmTitle'), t('settings.resetConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.resetAction'),
        style: 'destructive',
        onPress: () => void runReset(),
      },
    ]);
  };

  return (
    <AppScreen title={t('settings.title')}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenPanel>
          <Text variant="titleMedium">{t('settings.appearance')}</Text>
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as ThemeMode)}
            buttons={[
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ]}
          />
          <Text variant="bodySmall" style={styles.muted}>
            {t('settings.darkHint')}
          </Text>
          <Text variant="titleSmall">{t('settings.primaryColor')}</Text>
          <AccentColorPicker value={accentId} onChange={setAccentId} />
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">{t('settings.language')}</Text>
          <SegmentedButtons
            value={language}
            onValueChange={(value) => void changeAppLanguage(value as AppLanguage)}
            buttons={[
              { value: 'ru', label: t('settings.russian') },
              { value: 'en', label: t('settings.english') },
            ]}
          />
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">{t('settings.about')}</Text>
          <Text variant="bodyMedium">{t('settings.aboutText')}</Text>
          <Text variant="bodySmall" style={styles.muted}>
            {t('settings.version', { version: APP_VERSION })}
          </Text>
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">{t('settings.howto')}</Text>
          <Text variant="bodyMedium">{t('settings.howtoText')}</Text>
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">{t('settings.storage')}</Text>
          <Text>{t('settings.placesCount', { count: placesCount })}</Text>
          <Text>{t('settings.tripsCount', { count: tripsCount })}</Text>
          <Divider />
          <Button
            mode="outlined"
            textColor="#B00020"
            loading={busy}
            disabled={busy}
            onPress={confirmReset}
          >
            {t('settings.reset')}
          </Button>
          {status ? (
            <Text variant="bodyMedium" style={styles.status}>
              {status}
            </Text>
          ) : null}
        </ScreenPanel>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  muted: {
    opacity: 0.7,
  },
  status: {
    marginTop: 4,
  },
});
