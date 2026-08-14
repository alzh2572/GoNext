import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Chip, FAB, Text } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';
import {
  tripPlacesRepository,
  tripsRepository,
  type Trip,
} from '../../src/db';
import { formatTripPeriod } from '../../src/dates/iso';

function tripRole(total: number, visited: number): string {
  if (total === 0) {
    return 'пустой маршрут';
  }
  if (visited === 0) {
    return 'план';
  }
  if (visited === total) {
    return 'дневник';
  }
  return 'план и дневник';
}

export default function TripsListScreen() {
  const router = useRouter();
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
      setError(
        err instanceof Error ? err.message : 'Не удалось загрузить поездки',
      );
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
    <AppScreen title="Поездки">
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator animating size="large" />
          </View>
        ) : error ? (
          <View style={styles.panel}>
            <Text variant="bodyLarge">{error}</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.panel}>
            <Text variant="titleMedium">Пока нет поездок</Text>
            <Text variant="bodyMedium" style={styles.hint}>
              Создайте поездку и соберите маршрут из мест.
            </Text>
          </View>
        ) : (
          <FlatList
            data={trips}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const itemStats = stats[item.id] ?? { total: 0, visited: 0 };
              return (
                <Pressable
                  style={styles.item}
                  onPress={() => router.push(`/trips/${item.id}`)}
                >
                  <View style={styles.titleRow}>
                    <Text variant="titleMedium" style={styles.title}>
                      {item.title}
                    </Text>
                    {item.current ? (
                      <Chip compact>текущая</Chip>
                    ) : null}
                  </View>
                  <Text variant="bodyMedium" style={styles.hint}>
                    {formatTripPeriod(item.startDate, item.endDate)}
                  </Text>
                  <Text variant="bodySmall" style={styles.meta}>
                    {tripRole(itemStats.total, itemStats.visited)}
                    {itemStats.total > 0
                      ? ` · ${itemStats.visited} из ${itemStats.total} посещено`
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
          label="Добавить"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  panel: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    gap: 8,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
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
