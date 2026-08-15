import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Text,
  useTheme,
} from 'react-native-paper';
import { AppScreen } from '../../../components/AppScreen';
import { MapActions } from '../../../components/MapActions';
import { placesRepository, type Place } from '../../../src/db';
import { getDateLocale } from '../../../src/dates/iso';
import { messageFromError } from '../../../src/i18n/errors';
import { deletePhotoFiles } from '../../../src/photos/storage';
import { formatDd } from '../../../src/maps/dd';

export default function PlaceDetailsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const placeId = Number(id);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlace = useCallback(async () => {
    if (!Number.isFinite(placeId)) {
      setError(t('places.invalidId'));
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await placesRepository.getPlaceById(placeId);
      if (!data) {
        setError(t('places.notFound'));
        setPlace(null);
      } else {
        setPlace(data);
      }
    } catch (err) {
      setError(messageFromError(err, 'places.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [placeId, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadPlace();
    }, [loadPlace]),
  );

  const confirmDelete = () => {
    const runDelete = async () => {
      if (!place) {
        return;
      }
      try {
        setBusy(true);
        setError(null);
        const photos = [...place.photos];
        await placesRepository.deletePlace(place.id);
        await deletePhotoFiles(photos);
        router.replace('/places');
      } catch (err) {
        setError(messageFromError(err, 'places.deleteFailed'));
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }

    Alert.alert(t('places.deleteConfirmTitle'), t('places.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  return (
    <AppScreen
      title={place?.name ?? t('places.place')}
      actions={
        place ? (
          <Appbar.Action
            icon="pencil"
            onPress={() => router.push(`/places/${place.id}/edit`)}
          />
        ) : null
      }
    >
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : error && !place ? (
        <View style={[styles.panel, { backgroundColor: theme.colors.surface, margin: 16 }]}>
          <Text>{error}</Text>
          <Button onPress={() => router.replace('/places')}>{t('common.backToList')}</Button>
        </View>
      ) : place ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
            <Text variant="headlineSmall">{place.name}</Text>
            {place.description ? (
              <Text variant="bodyLarge">{place.description}</Text>
            ) : (
              <Text variant="bodyMedium" style={styles.muted}>
                {t('places.noDescription')}
              </Text>
            )}

            <View style={styles.chips}>
              {place.visitlater ? <Chip compact>{t('places.visitLater')}</Chip> : null}
              {place.liked ? <Chip compact icon="heart">{t('places.liked')}</Chip> : null}
            </View>

            <Text variant="titleSmall" style={styles.section}>
              {t('places.coordinates')}
            </Text>
            {place.dd ? (
              <Text>{formatDd(place.dd)}</Text>
            ) : (
              <Text style={styles.muted}>{t('places.notSpecified')}</Text>
            )}

            <Text variant="titleSmall" style={styles.section}>
              {t('places.photos')}
            </Text>
            {place.photos.length === 0 ? (
              <Text style={styles.muted}>{t('places.noPhotos')}</Text>
            ) : (
              <View style={styles.photos}>
                {place.photos.map((uri) => (
                  <Image key={uri} source={{ uri }} style={styles.photo} />
                ))}
              </View>
            )}

            <Text variant="bodySmall" style={styles.muted}>
              {t('places.createdAt', {
                date: new Date(place.createdAt).toLocaleString(getDateLocale()),
              })}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <MapActions dd={place.dd} label={place.name} disabled={busy} />
            <Button
              mode="outlined"
              disabled={busy}
              onPress={() => router.push(`/places/${place.id}/edit`)}
            >
              {t('common.edit')}
            </Button>
            <Button
              mode="text"
              textColor="#b00020"
              loading={busy}
              disabled={busy}
              onPress={confirmDelete}
            >
              {t('places.deletePlace')}
            </Button>
          </View>
        </ScrollView>
      ) : null}
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
  panel: {
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  section: {
    marginTop: 8,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photo: {
    width: 110,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
  muted: {
    opacity: 0.7,
  },
  error: {
    color: '#b00020',
  },
});
