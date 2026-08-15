import { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  Platform,
} from 'react-native';
import {
  Button,
  HelperText,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import type { Place, PlaceInput } from '../src/db/types';
import { formatDd, parseDd } from '../src/maps/dd';
import { getCurrentDecimalDegrees } from '../src/maps/location';
import {
  canStorePhotosLocally,
  deletePhotoFile,
  savePhotoFile,
} from '../src/photos/storage';

type PlaceFormProps = {
  initial?: Place | null;
  submitLabel: string;
  onSubmit: (input: PlaceInput) => Promise<void>;
};

export function PlaceForm({ initial, submitLabel, onSubmit }: PlaceFormProps) {
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [visitlater, setVisitlater] = useState(initial?.visitlater ?? true);
  const [liked, setLiked] = useState(initial?.liked ?? false);
  const [ddText, setDdText] = useState(
    initial?.dd ? formatDd(initial.dd) : '',
  );
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInvalid = name.trim().length === 0;

  const pickImage = async (fromCamera: boolean) => {
    if (!canStorePhotosLocally()) {
      setError('Фото доступны только на мобильном устройстве');
      return;
    }

    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(
        fromCamera
          ? 'Нет доступа к камере'
          : 'Нет доступа к галерее',
      );
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
      const folder = initial?.id ? `places/${initial.id}` : 'places/temp';
      const savedUri = await savePhotoFile(result.assets[0].uri, folder);
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

    Alert.alert('Удалить фото?', 'Фото будет удалено с устройства.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => void doRemove() },
    ]);
  };

  const fillCurrentLocation = async () => {
    try {
      setBusy(true);
      setError(null);
      const dd = await getCurrentDecimalDegrees();
      setDdText(formatDd(dd));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось получить текущие координаты',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (nameInvalid) {
      setError('Укажите название места');
      return;
    }

    const dd = parseDd(ddText);
    if (dd === 'invalid') {
      setError('Введите координаты в формате DD: 55.7558, 37.6173');
      return;
    }

    const input: PlaceInput = {
      name,
      description,
      visitlater,
      liked,
      dd,
      photos,
    };

    try {
      setBusy(true);
      setError(null);
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View
        style={[styles.panel, { backgroundColor: theme.colors.surface }]}
      >
        <TextInput
          label="Название *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Описание"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />

        <View style={styles.row}>
          <Text>Посетить позже</Text>
          <Switch value={visitlater} onValueChange={setVisitlater} />
        </View>
        <View style={styles.row}>
          <Text>Понравилось</Text>
          <Switch value={liked} onValueChange={setLiked} />
        </View>

        <Text variant="titleSmall" style={styles.section}>
          Координаты (Decimal Degrees, DD)
        </Text>
        <TextInput
          label="Широта, долгота"
          placeholder="55.7558, 37.6173"
          value={ddText}
          onChangeText={setDdText}
          mode="outlined"
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <HelperText type="info">
          Формат DD: широта и долгота через запятую, например 55.7558, 37.6173
        </HelperText>
        <Button
          mode="outlined"
          disabled={busy}
          onPress={() => void fillCurrentLocation()}
        >
          Подставить мои координаты
        </Button>

        <Text variant="titleSmall" style={styles.section}>
          Фотографии
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
          disabled={busy || nameInvalid}
          onPress={() => void handleSubmit()}
          style={styles.submit}
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  panel: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  section: {
    marginTop: 8,
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
  submit: {
    marginTop: 8,
  },
});
