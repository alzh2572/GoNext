import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { AppScreen } from '../../../components/AppScreen';
import { TripForm } from '../../../components/TripForm';
import { tripsRepository, type Trip, type TripInput } from '../../../src/db';
import { messageFromError } from '../../../src/i18n/errors';

export default function EditTripScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await tripsRepository.getTripById(tripId);
          if (!cancelled) {
            if (!data) {
              setError(t('trips.notFound'));
            }
            setTrip(data);
          }
        } catch (err) {
          if (!cancelled) {
            setError(messageFromError(err, 'trips.loadFailed'));
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [tripId, t]),
  );

  const handleSubmit = async (input: TripInput) => {
    await tripsRepository.updateTrip(tripId, input);
    router.replace(`/trips/${tripId}`);
  };

  return (
    <AppScreen title={t('trips.edit')}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : error || !trip ? (
        <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
          <Text>{error ?? t('trips.notFound')}</Text>
        </View>
      ) : (
        <TripForm
          key={trip.id}
          initial={trip}
          submitLabel={t('trips.submitSave')}
          onSubmit={handleSubmit}
        />
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
  panel: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
});
