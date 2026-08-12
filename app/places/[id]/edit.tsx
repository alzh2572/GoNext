import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { ActivityIndicator, Text } from 'react-native-paper';
import { AppScreen } from '../../../components/AppScreen';
import { PlaceForm } from '../../../components/PlaceForm';
import {
  placesRepository,
  type Place,
  type PlaceInput,
} from '../../../src/db';

export default function EditPlaceScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Number(id);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await placesRepository.getPlaceById(placeId);
          if (!cancelled) {
            if (!data) {
              setError('Место не найдено');
            }
            setPlace(data);
          }
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : 'Не удалось загрузить место',
            );
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
    }, [placeId]),
  );

  const handleSubmit = async (input: PlaceInput) => {
    await placesRepository.updatePlace(placeId, input);
    router.replace(`/places/${placeId}`);
  };

  return (
    <AppScreen title="Редактирование">
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : error || !place ? (
        <View style={styles.panel}>
          <Text>{error ?? 'Место не найдено'}</Text>
        </View>
      ) : (
        <PlaceForm
          key={place.id}
          initial={place}
          submitLabel="Сохранить"
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
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
});
