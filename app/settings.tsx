import { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { Button, Divider, SegmentedButtons, Text } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';
import { ScreenPanel } from '../components/ScreenPanel';
import { useAppTheme } from '../src/context/ThemePreference';
import { placesRepository, resetAllData, tripsRepository } from '../src/db';
import { clearPhotosDirectory } from '../src/photos/storage';
import type { ThemeMode } from '../src/theme';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function SettingsScreen() {
  const { mode, setMode } = useAppTheme();
  const [placesCount, setPlacesCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshCounts = useCallback(async () => {
    try {
      const [places, trips] = await Promise.all([
        placesRepository.countPlaces(),
        tripsRepository.countTrips(),
      ]);
      setPlacesCount(places);
      setTripsCount(trips);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Не удалось прочитать хранилище',
      );
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
      setStatus('Локальные данные удалены.');
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Не удалось сбросить данные',
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      void runReset();
      return;
    }

    Alert.alert(
      'Сбросить все данные?',
      'Будут удалены места, поездки, заметки и фото на этом устройстве. Отменить нельзя.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Сбросить', style: 'destructive', onPress: () => void runReset() },
      ],
    );
  };

  return (
    <AppScreen title="Настройки">
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenPanel>
          <Text variant="titleMedium">Оформление</Text>
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as ThemeMode)}
            buttons={[
              { value: 'light', label: 'Светлая' },
              { value: 'dark', label: 'Тёмная' },
            ]}
          />
          <Text variant="bodySmall" style={styles.muted}>
            В тёмной теме фоновая картинка скрывается.
          </Text>
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">О приложении</Text>
          <Text variant="bodyMedium">
            GoNext — дневник туриста. Места, поездки и заметки хранятся только на
            этом устройстве. Интернет нужен лишь для карт и навигатора.
          </Text>
          <Text variant="bodySmall" style={styles.muted}>
            Версия {APP_VERSION} · Expo SDK 54 · работает офлайн
          </Text>
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">Как пользоваться</Text>
          <Text variant="bodyMedium">
            1. Сохраняйте интересные места.{'\n'}
            2. Соберите из них поездку и отметьте её текущей.{'\n'}
            3. На экране «Следующее место» открывайте навигатор и отмечайте
            посещения.
          </Text>
        </ScreenPanel>

        <ScreenPanel>
          <Text variant="titleMedium">Локальное хранилище</Text>
          <Text>Мест: {placesCount}</Text>
          <Text>Поездок: {tripsCount}</Text>
          <Divider />
          <Button
            mode="outlined"
            textColor="#B00020"
            loading={busy}
            disabled={busy}
            onPress={confirmReset}
          >
            Сбросить все данные
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
