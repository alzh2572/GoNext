import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { AppScreen } from '../../../../components/AppScreen';
import {
  tripPlacesRepository,
  type TripPlaceWithPlace,
} from '../../../../src/db';
import { parseIsoDate, todayIsoDate } from '../../../../src/dates/iso';
import { messageFromError } from '../../../../src/i18n/errors';
import {
  canStorePhotosLocally,
  deletePhotoFile,
  deletePhotoFiles,
  savePhotoFile,
} from '../../../../src/photos/storage';
import { MapActions } from '../../../../components/MapActions';

export default function TripStopScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { id, stopId } = useLocalSearchParams<{ id: string; stopId: string }>();
  const tripId = Number(id);
  const tripPlaceId = Number(stopId);

  const [stop, setStop] = useState<TripPlaceWithPlace | null>(null);
  const [visited, setVisited] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStop = useCallback(async () => {
    try {
      setError(null);
      const data = await tripPlacesRepository.getTripPlaceWithPlace(tripPlaceId);
      if (!data || data.tripId !== tripId) {
        setError(t('stop.notFound'));
        setStop(null);
        return;
      }
      setStop(data);
      setVisited(data.visited);
      setVisitDate(data.visitDate ?? '');
      setNotes(data.notes);
      setPhotos(data.photos);
    } catch (err) {
      setError(messageFromError(err, 'trips.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tripId, tripPlaceId, t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadStop();
    }, [loadStop]),
  );

  const pickImage = async (fromCamera: boolean) => {
    if (!canStorePhotosLocally()) {
      setError(t('photos.mobileOnly'));
      return;
    }

    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(fromCamera ? t('photos.noCamera') : t('photos.noGallery'));
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: true,
          mediaTypes: ['images'],
        });

    if (result.canceled || !result.assets[0]?.uri) {
      return;
    }

    try {
      setBusy(true);
      setError(null);
      const savedUri = await savePhotoFile(
        result.assets[0].uri,
        `trips/${tripId}/stops/${tripPlaceId}`,
      );
      setPhotos((prev) => [...prev, savedUri]);
    } catch (err) {
      setError(messageFromError(err, 'photos.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = (uri: string) => {
    const doRemove = async () => {
      setPhotos((prev) => prev.filter((item) => item !== uri));
      try {
        await deletePhotoFile(uri);
      } catch {
        // файл мог уже отсутствовать
      }
    };

    if (Platform.OS === 'web') {
      void doRemove();
      return;
    }

    Alert.alert(t('stop.deletePhotoTitle'), t('stop.deletePhotoMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => void doRemove() },
    ]);
  };

  const handleSave = async () => {
    const parsedDate = parseIsoDate(visitDate);
    if (parsedDate === 'invalid') {
      setError(t('stop.visitDateInvalid'));
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await tripPlacesRepository.updateTripPlace(tripPlaceId, {
        visited,
        visitDate: visited ? parsedDate ?? todayIsoDate() : parsedDate,
        notes,
        photos,
      });
      router.replace(`/trips/${tripId}`);
    } catch (err) {
      setError(messageFromError(err, 'errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmRemoveFromTrip = () => {
    const runDelete = async () => {
      try {
        setBusy(true);
        const toDelete = [...photos];
        await tripPlacesRepository.deleteTripPlace(tripPlaceId);
        await deletePhotoFiles(toDelete);
        router.replace(`/trips/${tripId}`);
      } catch (err) {
        setError(messageFromError(err, 'trips.deleteFailed'));
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }

    Alert.alert(t('stop.removeConfirmTitle'), t('stop.removeConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('stop.remove'), style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  const onVisitedChange = (value: boolean) => {
    setVisited(value);
    if (value && !visitDate.trim()) {
      setVisitDate(todayIsoDate());
    }
  };

  return (
    <AppScreen title={stop?.place.name ?? t('stop.title')}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator animating size="large" />
        </View>
      ) : error && !stop ? (
        <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
          <Text>{error}</Text>
        </View>
      ) : stop ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
            {stop.place.description ? (
              <Text variant="bodyLarge">{stop.place.description}</Text>
            ) : null}

            <View style={styles.row}>
              <Text>{t('stop.visited')}</Text>
              <Switch value={visited} onValueChange={onVisitedChange} />
            </View>
            <TextInput
              label={t('stop.visitDate')}
              placeholder={t('trips.datePlaceholder')}
              value={visitDate}
              onChangeText={setVisitDate}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <TextInput
              label={t('stop.notes')}
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <Text variant="titleSmall" style={styles.section}>
              {t('stop.visitPhotos')}
            </Text>
            <View style={styles.photoActions}>
              <Button
                mode="outlined"
                disabled={busy}
                onPress={() => void pickImage(false)}
              >
                {t('photos.gallery')}
              </Button>
              <Button
                mode="outlined"
                disabled={busy}
                onPress={() => void pickImage(true)}
              >
                {t('photos.camera')}
              </Button>
            </View>
            <View style={styles.photos}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photo} />
                  <Button compact onPress={() => removePhoto(uri)}>
                    {t('common.delete')}
                  </Button>
                </View>
              ))}
            </View>

            {error ? <HelperText type="error">{error}</HelperText> : null}

            <Button
              mode="contained"
              loading={busy}
              disabled={busy}
              onPress={() => void handleSave()}
            >
              {t('common.save')}
            </Button>
            <MapActions dd={stop.place.dd} label={stop.place.name} disabled={busy} />
            <Button
              mode="text"
              textColor="#b00020"
              disabled={busy}
              onPress={confirmRemoveFromTrip}
            >
              {t('stop.removeFromRoute')}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: 'transparent',
  },
  section: {
    marginTop: 4,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrap: {
    width: 120,
    alignItems: 'center',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#ddd',
  },
});
