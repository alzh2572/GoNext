import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Button, Chip, Text } from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';
import { MapActions } from '../components/MapActions';
import {
  EmptyState,
  LoadingState,
  ScreenPanel,
} from '../components/ScreenPanel';
import {
  tripPlacesRepository,
  tripsRepository,
  type Trip,
  type TripPlaceWithPlace,
} from '../src/db';
import { formatDd } from '../src/maps/dd';
import { todayIsoDate } from '../src/dates/iso';

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'no-current' }
  | { kind: 'empty-route'; trip: Trip }
  | { kind: 'all-visited'; trip: Trip }
  | { kind: 'next'; trip: Trip; stop: TripPlaceWithPlace };

export default function NextPlaceScreen() {
  const router = useRouter();
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    try {
      setActionError(null);
      const trip = await tripsRepository.getCurrentTrip();
      if (!trip) {
        setState({ kind: 'no-current' });
        return;
      }

      const route = await tripPlacesRepository.getTripPlacesWithPlace(trip.id);
      if (route.length === 0) {
        setState({ kind: 'empty-route', trip });
        return;
      }

      const stop = route.find((item) => !item.visited) ?? null;
      if (!stop) {
        setState({ kind: 'all-visited', trip });
        return;
      }

      setState({ kind: 'next', trip, stop });
    } catch (err) {
      setState({
        kind: 'error',
        message:
          err instanceof Error ? err.message : 'Не удалось загрузить следующее место',
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setState({ kind: 'loading' });
      void loadNext();
    }, [loadNext]),
  );

  const markVisited = async (stop: TripPlaceWithPlace) => {
    try {
      setBusy(true);
      setActionError(null);
      await tripPlacesRepository.updateTripPlace(stop.id, {
        visited: true,
        visitDate: todayIsoDate(),
      });
      await loadNext();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Не удалось отметить посещение',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="Следующее место">
      {state.kind === 'loading' ? (
        <LoadingState />
      ) : state.kind === 'error' ? (
        <EmptyState
          title="Не удалось загрузить"
          message={state.message}
          actionLabel="Повторить"
          onAction={() => void loadNext()}
        />
      ) : state.kind === 'no-current' ? (
        <EmptyState
          title="Нет текущей поездки"
          message="Отметьте поездку как текущую, чтобы видеть следующее место маршрута."
          actionLabel="К поездкам"
          onAction={() => router.push('/trips')}
        />
      ) : state.kind === 'empty-route' ? (
        <EmptyState
          title={state.trip.title}
          message="В текущей поездке пока нет мест."
          actionLabel="Добавить место"
          onAction={() => router.push(`/trips/${state.trip.id}/add`)}
        />
      ) : state.kind === 'all-visited' ? (
        <EmptyState
          title={state.trip.title}
          message="Все места маршрута посещены."
          actionLabel="Открыть дневник"
          onAction={() => router.push(`/trips/${state.trip.id}`)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenPanel>
            <Chip compact>текущая поездка</Chip>
            <Text variant="titleSmall" style={styles.muted}>
              {state.trip.title}
            </Text>
            <Text variant="headlineSmall">{state.stop.place.name}</Text>
            {state.stop.place.description ? (
              <Text variant="bodyLarge">{state.stop.place.description}</Text>
            ) : (
              <Text style={styles.muted}>Без описания</Text>
            )}

            <Text variant="titleSmall" style={styles.section}>
              Координаты (DD)
            </Text>
            {state.stop.place.dd ? (
              <Text>{formatDd(state.stop.place.dd)}</Text>
            ) : (
              <Text style={styles.muted}>Не указаны</Text>
            )}

            {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

            <MapActions
              dd={state.stop.place.dd}
              label={state.stop.place.name}
              disabled={busy}
            />
            <Button
              mode="outlined"
              loading={busy}
              disabled={busy}
              onPress={() => void markVisited(state.stop)}
            >
              Отметить посещённым
            </Button>
            <Button
              onPress={() =>
                router.push(`/trips/${state.trip.id}/stops/${state.stop.id}`)
              }
            >
              Подробнее
            </Button>
          </ScreenPanel>
        </ScrollView>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginTop: 4,
  },
  muted: {
    opacity: 0.75,
  },
  error: {
    color: '#b00020',
  },
});
