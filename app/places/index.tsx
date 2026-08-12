import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FAB, Text } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';
import { placesRepository, type Place } from '../../src/db';
import { formatDd } from '../../src/maps/dd';

export default function PlacesListScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    try {
      setError(null);
      const data = await placesRepository.getAllPlaces();
      setPlaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить места');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadPlaces();
    }, [loadPlaces]),
  );

  return (
    <AppScreen title="Места">
      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator animating size="large" />
          </View>
        ) : error ? (
          <View style={styles.panel}>
            <Text variant="bodyLarge">{error}</Text>
          </View>
        ) : places.length === 0 ? (
          <View style={styles.panel}>
            <Text variant="titleMedium">Пока нет мест</Text>
            <Text variant="bodyMedium" style={styles.hint}>
              Добавьте первое место, которое хотите посетить.
            </Text>
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.item}
                onPress={() => router.push(`/places/${item.id}`)}
              >
                <Text variant="titleMedium">{item.name}</Text>
                {item.description ? (
                  <Text variant="bodyMedium" numberOfLines={2} style={styles.hint}>
                    {item.description}
                  </Text>
                ) : null}
                <Text variant="bodySmall" style={styles.meta}>
                  {[
                    item.visitlater ? 'посетить позже' : null,
                    item.liked ? 'понравилось' : null,
                    item.dd ? formatDd(item.dd, 4) : null,
                    item.photos.length > 0 ? `фото: ${item.photos.length}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </Pressable>
            )}
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/places/new')}
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
