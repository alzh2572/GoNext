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
import { PlaceForm } from '../../../components/PlaceForm';
import {
  placesRepository,
  type Place,
  type PlaceInput,
} from '../../../src/db';
import { messageFromError } from '../../../src/i18n/errors';

export default function EditPlaceScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
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
              setError(t('places.notFound'));
            }
            setPlace(data);
          }
        } catch (err) {
          if (!cancelled) {
            setError(messageFromError(err, 'places.loadFailed'));
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
    }, [placeId, t]),
  );

  const handleSubmit = async (input: PlaceInput) => {
    await placesRepository.updatePlace(placeId, input);
    router.replace(`/places/${placeId}`);
  };

  return (
    <AppScreen title={t('places.edit')}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : error || !place ? (
        <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
          <Text>{error ?? t('places.notFound')}</Text>
        </View>
      ) : (
        <PlaceForm
          key={place.id}
          initial={place}
          submitLabel={t('places.submitSave')}
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
