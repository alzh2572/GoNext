import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Button,
  Chip,
  Text,
} from 'react-native-paper';
import { AppScreen } from '../components/AppScreen';
import { MapActions } from '../components/MapActions';
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
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : state.kind === 'error' ? (
        <View style={styles.wrap}>
          <View style={styles.panel}>
            <Text>{state.message}</Text>
            <Button onPress={() => void loadNext()}>Повторить</Button>
          </View>
        </View>
      ) : state.kind === 'no-current' ? (
        <View style={styles.wrap}>
          <View style={styles.panel}>
            <Text variant="titleMedium">Нет текущей поездки</Text>
            <Text style={styles.muted}>
              Отметьте поездку как текущую, чтобы видеть следующее место маршрута.
            </Text>
            <Button mode="contained" onPress={() => router.push('/trips')}>
              К поездкам
            </Button>
          </View>
        </View>
      ) : state.kind === 'empty-route' ? (
        <View style={styles.wrap}>
          <View style={styles.panel}>
            <Text variant="titleMedium">{state.trip.title}</Text>
            <Text style={styles.muted}>В текущей поездке пока нет мест.</Text>
            <Button
              mode="contained"
              onPress={() => router.push(`/trips/${state.trip.id}/add`)}
            >
              Добавить место
            </Button>
          </View>
        </View>
      ) : state.kind === 'all-visited' ? (
        <View style={styles.wrap}>
          <View style={styles.panel}>
            <Text variant="titleMedium">{state.trip.title}</Text>
            <Text>Все места маршрута посещены.</Text>
            <Button
              mode="contained"
              onPress={() => router.push(`/trips/${state.trip.id}`)}
            >
              Открыть дневник
            </Button>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.panel}>
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
          </View>
        </ScrollView>
      )}
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
  },
  wrap: {
    padding: 16,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 12,
    padding: 16,
    gap: 10,
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
