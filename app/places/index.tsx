import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { FAB, Text, useTheme } from 'react-native-paper';
import { AppScreen } from '../../components/AppScreen';
import { EmptyState, LoadingState } from '../../components/ScreenPanel';
import { placesRepository, type Place } from '../../src/db';
import { formatDd } from '../../src/maps/dd';
import { cardShape } from '../../src/theme';

export default function PlacesListScreen() {
  const router = useRouter();
  const theme = useTheme();
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
          <LoadingState />
        ) : error ? (
          <EmptyState
            title="Не удалось загрузить места"
            message={error}
            actionLabel="Повторить"
            onAction={() => {
              setLoading(true);
              void loadPlaces();
            }}
          />
        ) : places.length === 0 ? (
          <EmptyState
            title="Пока нет мест"
            message="Добавьте первое место, которое хотите посетить."
            actionLabel="Добавить место"
            onAction={() => router.push('/places/new')}
          />
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.item,
                  { backgroundColor: theme.colors.surface },
                ]}
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
  list: {
    padding: 16,
    paddingBottom: 96,
    gap: 12,
  },
  item: {
    ...cardShape,
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
