import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Text } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';
import {
  placesRepository,
  tripsRepository,
  type Place,
  type Trip,
} from '../src/db';
import { getPhotosDirectoryUri, canStorePhotosLocally } from '../src/photos/storage';

export default function SettingsScreen() {
  const [placesCount, setPlacesCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshCounts = useCallback(async () => {
    const [places, trips] = await Promise.all([
      placesRepository.countPlaces(),
      tripsRepository.countTrips(),
    ]);
    setPlacesCount(places);
    setTripsCount(trips);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshCounts();
    }, [refreshCounts]),
  );

  const runStorageSmokeTest = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const place: Place = await placesRepository.createPlace({
        name: 'Тестовое место',
        description: 'Проверка CRUD этапа 1',
        visitlater: true,
        liked: false,
        dd: { latitude: 55.7558, longitude: 37.6173 },
      });

      const trip: Trip = await tripsRepository.createTrip({
        title: 'Тестовая поездка',
        description: 'Проверка CRUD этапа 1',
        startDate: '2026-08-10',
        endDate: '2026-08-15',
        current: true,
      });

      await placesRepository.updatePlace(place.id, {
        name: 'Тестовое место (обновлено)',
        description: place.description,
        visitlater: place.visitlater,
        liked: true,
        dd: place.dd,
        photos: place.photos,
      });

      await tripsRepository.deleteTrip(trip.id);
      await placesRepository.deletePlace(place.id);

      await refreshCounts();
      setStatus(`CRUD OK. Каталог фото: ${getPhotosDirectoryUri()}`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Ошибка проверки хранилища',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="Настройки">
      <View style={styles.content}>
        <Text variant="titleMedium">Локальное хранилище</Text>
        <Text>Мест в БД: {placesCount}</Text>
        <Text>Поездок в БД: {tripsCount}</Text>
        <Text variant="bodySmall" style={styles.path}>
          Фото:{' '}
          {canStorePhotosLocally()
            ? getPhotosDirectoryUri()
            : 'недоступно в браузере (только на телефоне)'}
        </Text>

        <Button
          mode="contained"
          loading={busy}
          disabled={busy}
          onPress={() => void runStorageSmokeTest()}
        >
          Проверить CRUD (Place / Trip)
        </Button>

        {status ? (
          <Text variant="bodyMedium" style={styles.status}>
            {status}
          </Text>
        ) : null}

        <Text variant="bodySmall" style={styles.note}>
          Версия 1.0.0 · данные только на устройстве
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  path: {
    opacity: 0.7,
  },
  status: {
    marginTop: 4,
  },
  note: {
    marginTop: 'auto',
    opacity: 0.6,
  },
});
