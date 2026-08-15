import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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
import { messageFromError } from '../src/i18n/errors';

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'no-current' }
  | { kind: 'empty-route'; trip: Trip }
  | { kind: 'all-visited'; trip: Trip }
  | { kind: 'next'; trip: Trip; stop: TripPlaceWithPlace };

export default function NextPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
        message: messageFromError(err, 'next.loadError'),
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
      setActionError(messageFromError(err, 'next.markFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title={t('next.title')}>
      {state.kind === 'loading' ? (
        <LoadingState />
      ) : state.kind === 'error' ? (
        <EmptyState
          title={t('next.loadErrorTitle')}
          message={state.message}
          actionLabel={t('common.retry')}
          onAction={() => void loadNext()}
        />
      ) : state.kind === 'no-current' ? (
        <EmptyState
          title={t('next.noCurrentTitle')}
          message={t('next.noCurrentMessage')}
          actionLabel={t('next.toTrips')}
          onAction={() => router.push('/trips')}
        />
      ) : state.kind === 'empty-route' ? (
        <EmptyState
          title={state.trip.title}
          message={t('next.emptyRouteMessage')}
          actionLabel={t('trips.addPlace')}
          onAction={() => router.push(`/trips/${state.trip.id}/add`)}
        />
      ) : state.kind === 'all-visited' ? (
        <EmptyState
          title={state.trip.title}
          message={t('next.allVisited')}
          actionLabel={t('next.openDiary')}
          onAction={() => router.push(`/trips/${state.trip.id}`)}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenPanel>
            <Chip compact>{t('next.currentTrip')}</Chip>
            <Text variant="titleSmall" style={styles.muted}>
              {state.trip.title}
            </Text>
            <Text variant="headlineSmall">{state.stop.place.name}</Text>
            {state.stop.place.description ? (
              <Text variant="bodyLarge">{state.stop.place.description}</Text>
            ) : (
              <Text style={styles.muted}>{t('next.noDescription')}</Text>
            )}

            <Text variant="titleSmall" style={styles.section}>
              {t('next.coordinates')}
            </Text>
            {state.stop.place.dd ? (
              <Text>{formatDd(state.stop.place.dd)}</Text>
            ) : (
              <Text style={styles.muted}>{t('next.notSpecified')}</Text>
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
              {t('next.markVisited')}
            </Button>
            <Button
              onPress={() =>
                router.push(`/trips/${state.trip.id}/stops/${state.stop.id}`)
              }
            >
              {t('next.details')}
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
