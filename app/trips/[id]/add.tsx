import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Button, Text, useTheme } from 'react-native-paper';
import { AppScreen } from '../../../components/AppScreen';
import {
  placesRepository,
  tripPlacesRepository,
  type Place,
} from '../../../src/db';

export default function AddTripPlaceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tripId = Number(id);

  const [places, setPlaces] = useState<Place[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    try {
      setError(null);
      const [allPlaces, route] = await Promise.all([
        placesRepository.getAllPlaces(),
        tripPlacesRepository.getTripPlaces(tripId),
      ]);
      const usedIds = new Set(route.map((item) => item.placeId));
      setPlaces(allPlaces.filter((place) => !usedIds.has(place.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить места');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadPlaces();
    }, [loadPlaces]),
  );

  const addPlace = async (placeId: number) => {
    try {
      setBusyId(placeId);
      setError(null);
      const order = await tripPlacesRepository.getNextOrder(tripId);
      await tripPlacesRepository.addTripPlace({
        tripId,
        placeId,
        order,
      });
      router.replace(`/trips/${tripId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить место');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppScreen title="Добавить в маршрут">
      <View style={styles.container}>
        <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
          <Button
            mode="contained"
            onPress={() => router.push(`/trips/${tripId}/add-new`)}
          >
            Создать новое место
          </Button>
          <Text variant="bodyMedium" style={styles.hint}>
            Или выберите место из базы:
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator animating size="large" />
          </View>
        ) : places.length === 0 ? (
          <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
            <Text>Нет свободных мест в базе. Создайте новое.</Text>
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.item, { backgroundColor: theme.colors.surface }]}
                disabled={busyId != null}
                onPress={() => void addPlace(item.id)}
              >
                <Text variant="titleMedium">{item.name}</Text>
                {item.description ? (
                  <Text variant="bodyMedium" numberOfLines={2} style={styles.hint}>
                    {item.description}
                  </Text>
                ) : null}
                {busyId === item.id ? (
                  <ActivityIndicator animating />
                ) : null}
              </Pressable>
            )}
          />
        )}
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
    paddingTop: 0,
    gap: 12,
  },
  panel: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  hint: {
    opacity: 0.75,
  },
  error: {
    color: '#b00020',
  },
});
