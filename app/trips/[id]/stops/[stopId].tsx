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
        setError('Место поездки не найдено');
        setStop(null);
        return;
      }
      setStop(data);
      setVisited(data.visited);
      setVisitDate(data.visitDate ?? '');
      setNotes(data.notes);
      setPhotos(data.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [tripId, tripPlaceId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadStop();
    }, [loadStop]),
  );

  const pickImage = async (fromCamera: boolean) => {
    if (!canStorePhotosLocally()) {
      setError('Фото доступны только на мобильном устройстве');
      return;
    }

    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(fromCamera ? 'Нет доступа к камере' : 'Нет доступа к галерее');
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
      setError(err instanceof Error ? err.message : 'Не удалось сохранить фото');
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

    Alert.alert('Удалить фото?', 'Фото посещения будет удалено с устройства.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => void doRemove() },
    ]);
  };

  const handleSave = async () => {
    const parsedDate = parseIsoDate(visitDate);
    if (parsedDate === 'invalid') {
      setError('Дата визита в формате ГГГГ-ММ-ДД');
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
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
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
        setError(err instanceof Error ? err.message : 'Не удалось удалить');
      } finally {
        setBusy(false);
      }
    };

    if (Platform.OS === 'web') {
      void runDelete();
      return;
    }

    Alert.alert(
      'Убрать из маршрута?',
      'Место останется в базе мест, заметки посещения будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Убрать', style: 'destructive', onPress: () => void runDelete() },
      ],
    );
  };

  const onVisitedChange = (value: boolean) => {
    setVisited(value);
    if (value && !visitDate.trim()) {
      setVisitDate(todayIsoDate());
    }
  };

  return (
    <AppScreen title={stop?.place.name ?? 'Место в поездке'}>
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
              <Text>Посещено</Text>
              <Switch value={visited} onValueChange={onVisitedChange} />
            </View>
            <TextInput
              label="Дата визита"
              placeholder="2026-08-14"
              value={visitDate}
              onChangeText={setVisitDate}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <TextInput
              label="Заметки"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            <Text variant="titleSmall" style={styles.section}>
              Фото посещения
            </Text>
            <View style={styles.photoActions}>
              <Button
                mode="outlined"
                disabled={busy}
                onPress={() => void pickImage(false)}
              >
                Галерея
              </Button>
              <Button
                mode="outlined"
                disabled={busy}
                onPress={() => void pickImage(true)}
              >
                Камера
              </Button>
            </View>
            <View style={styles.photos}>
              {photos.map((uri) => (
                <View key={uri} style={styles.photoWrap}>
                  <Image source={{ uri }} style={styles.photo} />
                  <Button compact onPress={() => removePhoto(uri)}>
                    Удалить
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
              Сохранить
            </Button>
            <MapActions dd={stop.place.dd} label={stop.place.name} disabled={busy} />
            <Button
              mode="text"
              textColor="#b00020"
              disabled={busy}
              onPress={confirmRemoveFromTrip}
            >
              Убрать из маршрута
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
