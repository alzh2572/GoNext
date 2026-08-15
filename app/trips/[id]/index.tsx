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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { AppScreen } from '../../../components/AppScreen';
import {
  tripPlacesRepository,
  tripsRepository,
  type Trip,
  type TripPlaceWithPlace,
} from '../../../src/db';
import { formatIsoDate, formatTripPeriod } from '../../../src/dates/iso';
import { messageFromError } from '../../../src/i18n/errors';
import { deletePhotoFiles } from '../../../src/photos/storage';

function tripRoleLabel(stops: TripPlaceWithPlace[], t: TFunction): string {
  if (stops.length === 0) {
    return t('trips.roleEmptyTrip');
  }
  const visited = stops.filter((item) => item.visited).length;
  if (visited === 0) {
    return t('trips.rolePlanTrip');
  }
  if (visited === stops.length) {
    return t('trips.roleDiaryTrip');
  }
  return t('trips.roleBothTrip');
}

export default function TripDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<TripPlaceWithPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const surface = { backgroundColor: theme.colors.surface };

  const loadTrip = useCallback(async () => {
    if (!Number.isFinite(tripId)) {
      setError(t('trips.invalidId'));
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
        setError(t('trips.notFound'));
        setTrip(null);
        setStops([]);
      } else {
        setTrip(data);
        setStops(route);
      }
    } catch (err) {
      setError(messageFromError(err, 'trips.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tripId, t]);

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
      setError(messageFromError(err, 'trips.reorderFailed'));
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
        setError(messageFromError(err, 'trips.deleteFailed'));
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }

    Alert.alert(t('trips.deleteConfirmTitle'), t('trips.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  return (
    <AppScreen
      title={trip?.title ?? t('trips.trip')}
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
        <View style={[styles.panel, surface]}>
          <Text>{error}</Text>
          <Button onPress={() => router.replace('/trips')}>{t('common.backToList')}</Button>
        </View>
      ) : trip ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.panel, surface]}>
            <View style={styles.chips}>
              <Chip compact>{tripRoleLabel(stops, t)}</Chip>
              {trip.current ? <Chip compact>{t('trips.current')}</Chip> : null}
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
              {t('trips.addPlace')}
            </Button>
            <Button
              mode="outlined"
              disabled={busy}
              onPress={() => router.push(`/trips/${trip.id}/edit`)}
            >
              {t('trips.editTrip')}
            </Button>
          </View>

          {stops.length === 0 ? (
            <View style={[styles.panel, surface]}>
              <Text variant="titleMedium">{t('trips.emptyRouteTitle')}</Text>
              <Text style={styles.muted}>{t('trips.emptyRouteMessage')}</Text>
            </View>
          ) : (
            stops.map((stop, index) => (
              <Pressable
                key={stop.id}
                style={[styles.stop, surface]}
                onPress={() =>
                  router.push(`/trips/${trip.id}/stops/${stop.id}`)
                }
              >
                <View style={styles.stopHeader}>
                  <Text variant="titleMedium" style={styles.stopTitle}>
                    {index + 1}. {stop.place.name}
                  </Text>
                  <Chip compact>
                    {stop.visited ? t('trips.visited') : t('trips.plan')}
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
                      ? t('trips.visitPhotos', { count: stop.photos.length })
                      : null,
                    stop.place.dd ? t('trips.hasCoordinates') : null,
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
            {t('trips.deleteTrip')}
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
