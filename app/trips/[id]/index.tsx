import { useCallback, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  IconButton,
  Text,
} from 'react-native-paper';
import { AppScreen } from '../../../components/AppScreen';
import {
  tripPlacesRepository,
  tripsRepository,
  type Trip,
  type TripPlaceWithPlace,
} from '../../../src/db';
import { formatIsoDate, formatTripPeriod } from '../../../src/dates/iso';
import { deletePhotoFiles } from '../../../src/photos/storage';

function tripRoleLabel(stops: TripPlaceWithPlace[]): string {
  if (stops.length === 0) {
    return 'Пустой маршрут';
  }
  const visited = stops.filter((item) => item.visited).length;
  if (visited === 0) {
    return 'План поездки';
  }
  if (visited === stops.length) {
    return 'Дневник поездки';
  }
  return 'План и дневник';
}

export default function TripDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripPlaceWithPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    if (!Number.isFinite(tripId)) {
      setError('Некорректный идентификатор поездки');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [data, route] = await Promise.all([
        tripsRepository.getTripById(tripId),
        tripPlacesRepository.getTripPlacesWithPlace(tripId),
      ]);
      if (!data) {
        setError('Поездка не найдена');
        setTrip(null);
        setStops([]);
      } else {
        setTrip(data);
        setStops(route);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadTrip();
    }, [loadTrip]),
  );

  const moveStop = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stops.length) {
      return;
    }
    const orderedIds = stops.map((item) => item.id);
    const currentId = orderedIds[index];
    orderedIds[index] = orderedIds[nextIndex];
    orderedIds[nextIndex] = currentId;
    try {
      setBusy(true);
      await tripPlacesRepository.reorderTripPlaces(tripId, orderedIds);
      await loadTrip();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить порядок');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    const runDelete = async () => {
      if (!trip) {
        return;
      }
      try {
        setBusy(true);
        setError(null);
        const photos = stops.flatMap((item) => item.photos);
        await tripsRepository.deleteTrip(trip.id);
        await deletePhotoFiles(photos);
        router.replace('/trips');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось удалить');
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }

    Alert.alert('Удалить поездку?', 'Маршрут и заметки посещений будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  return (
    <AppScreen
      title={trip?.title ?? 'Поездка'}
      actions={
        trip ? (
          <Appbar.Action
            icon="pencil"
            onPress={() => router.push(`/trips/${trip.id}/edit`)}
          />
        ) : null
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : error && !trip ? (
        <View style={styles.panel}>
          <Text>{error}</Text>
          <Button onPress={() => router.replace('/trips')}>К списку</Button>
        </View>
      ) : trip ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.panel}>
            <View style={styles.chips}>
              <Chip compact>{tripRoleLabel(stops)}</Chip>
              {trip.current ? <Chip compact>текущая</Chip> : null}
            </View>
            {trip.description ? (
              <Text variant="bodyLarge">{trip.description}</Text>
            ) : null}
            <Text variant="bodyMedium">
              {formatTripPeriod(trip.startDate, trip.endDate)}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button
              mode="contained"
              disabled={busy}
              onPress={() => router.push(`/trips/${trip.id}/add`)}
            >
              Добавить место
            </Button>
            <Button
              mode="outlined"
              disabled={busy}
              onPress={() => router.push(`/trips/${trip.id}/edit`)}
            >
              Редактировать поездку
            </Button>
          </View>

          {stops.length === 0 ? (
            <View style={styles.panel}>
              <Text variant="titleMedium">Маршрут пуст</Text>
              <Text style={styles.muted}>
                Добавьте места из базы или создайте новое место сразу в поездке.
              </Text>
            </View>
          ) : (
            stops.map((stop, index) => (
              <Pressable
                key={stop.id}
                style={styles.stop}
                onPress={() =>
                  router.push(`/trips/${trip.id}/stops/${stop.id}`)
                }
              >
                <View style={styles.stopHeader}>
                  <Text variant="titleMedium" style={styles.stopTitle}>
                    {index + 1}. {stop.place.name}
                  </Text>
                  <Chip compact>
                    {stop.visited ? 'посещено' : 'план'}
                  </Chip>
                </View>
                {stop.visited && stop.visitDate ? (
                  <Text variant="bodySmall" style={styles.muted}>
                    {formatIsoDate(stop.visitDate)}
                  </Text>
                ) : null}
                {stop.notes ? (
                  <Text variant="bodyMedium" numberOfLines={2}>
                    {stop.notes}
                  </Text>
                ) : null}
                <Text variant="bodySmall" style={styles.muted}>
                  {[
                    stop.photos.length > 0
                      ? `фото посещения: ${stop.photos.length}`
                      : null,
                    stop.place.dd ? 'есть координаты' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
                <View style={styles.orderRow}>
                  <IconButton
                    icon="arrow-up"
                    disabled={busy || index === 0}
                    onPress={() => void moveStop(index, -1)}
                  />
                  <IconButton
                    icon="arrow-down"
                    disabled={busy || index === stops.length - 1}
                    onPress={() => void moveStop(index, 1)}
                  />
                </View>
              </Pressable>
            ))
          )}

          <Button
            mode="text"
            textColor="#b00020"
            loading={busy}
            disabled={busy}
            onPress={confirmDelete}
          >
            Удалить поездку
          </Button>
        </ScrollView>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stop: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopTitle: {
    flex: 1,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  muted: {
    opacity: 0.7,
  },
  error: {
    color: '#b00020',
  },
});
