import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Chip, FAB, Text, useTheme } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState, LoadingState } from '../../components/ScreenPanel';
import {
  tripPlacesRepository,
  tripsRepository,
  type Trip,
} from '../../src/db';
import { formatTripPeriod } from '../../src/dates/iso';
import { messageFromError } from '../../src/i18n/errors';
import { cardShape } from '../../src/theme';

function tripRole(total: number, visited: number, t: TFunction): string {
  if (total === 0) {
    return t('trips.roleEmpty');
  }
  if (visited === 0) {
    return t('trips.rolePlan');
  }
  if (visited === total) {
    return t('trips.roleDiary');
  }
  return t('trips.roleBoth');
}

export default function TripsListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<
    Record<number, { total: number; visited: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    try {
      setError(null);
      const [data, placeStats] = await Promise.all([
        tripsRepository.getAllTrips(),
        tripPlacesRepository.getTripPlaceStats(),
      ]);
      setTrips(data);
      setStats(placeStats);
    } catch (err) {
      setError(messageFromError(err, 'trips.loadError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadTrips();
    }, [loadTrips]),
  );

  return (
    <AppScreen title={t('trips.title')}>
      <View style={styles.container}>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState
            title={t('trips.loadErrorTitle')}
            message={error}
            actionLabel={t('common.retry')}
            onAction={() => {
              setLoading(true);
              void loadTrips();
            }}
          />
        ) : trips.length === 0 ? (
          <EmptyState
            title={t('trips.emptyTitle')}
            message={t('trips.emptyMessage')}
            actionLabel={t('trips.emptyAction')}
            onAction={() => router.push('/trips/new')}
          />
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const itemStats = stats[item.id] ?? { total: 0, visited: 0 };
              return (
                <Pressable
                  style={[
                    styles.item,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  onPress={() => router.push(`/trips/${item.id}`)}
                >
                  <View style={styles.titleRow}>
                    <Text variant="titleMedium" style={styles.title}>
                      {item.title}
                    </Text>
                    {item.current ? (
                      <Chip compact>{t('trips.current')}</Chip>
                    ) : null}
                  </View>
                  <Text variant="bodyMedium" style={styles.hint}>
                    {formatTripPeriod(item.startDate, item.endDate)}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    {tripRole(itemStats.total, itemStats.visited, t)}
                    {itemStats.total > 0
                      ? ` · ${t('trips.visitedOf', {
                          visited: itemStats.visited,
                          total: itemStats.total,
                        })}`
                      : ''}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/trips/new')}
          label={t('common.add')}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  item: {
    ...cardShape,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
  },
  hint: {
    opacity: 0.75,
  },
  meta: {
    marginTop: 4,
    opacity: 0.65,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
