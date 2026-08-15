import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Button,
  HelperText,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import type { Trip, TripInput } from '../src/db/types';
import { parseIsoDate } from '../src/dates/iso';
import { messageFromError } from '../src/i18n/errors';

type TripFormProps = {
  initial?: Trip | null;
  submitLabel: string;
  onSubmit: (input: TripInput) => Promise<void>;
};

export function TripForm({ initial, submitLabel, onSubmit }: TripFormProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [current, setCurrent] = useState(initial?.current ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInvalid = title.trim().length === 0;

  const handleSubmit = async () => {
    if (titleInvalid) {
      setError(t('trips.titleRequired'));
      return;
    }

    const parsedStart = parseIsoDate(startDate);
    const parsedEnd = parseIsoDate(endDate);

    if (parsedStart === 'invalid' || parsedEnd === 'invalid') {
      setError(t('trips.dateInvalid'));
      return;
    }

    if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
      setError(t('trips.dateOrder'));
      return;
    }

    try {
      setBusy(true);
      setError(null);
      await onSubmit({
        title,
        description,
        startDate: parsedStart,
        endDate: parsedEnd,
        current,
      });
    } catch (err) {
      setError(messageFromError(err, 'errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.panel, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          label={t('trips.titleLabel')}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label={t('trips.descriptionLabel')}
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        <TextInput
          label={t('trips.startDate')}
          placeholder={t('trips.datePlaceholder')}
          value={startDate}
          onChangeText={setStartDate}
          mode="outlined"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <TextInput
          label={t('trips.endDate')}
          placeholder={t('trips.datePlaceholder')}
          value={endDate}
          onChangeText={setEndDate}
          mode="outlined"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <HelperText type="info">{t('trips.dateHint')}</HelperText>

        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text>{t('trips.currentTrip')}</Text>
            <Text variant="bodySmall" style={styles.hint}>
              {t('trips.currentTripHint')}
            </Text>
          </View>
          <Switch value={current} onValueChange={setCurrent} />
        </View>

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          loading={busy}
          disabled={busy || titleInvalid}
          onPress={() => void handleSubmit()}
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
    paddingVertical: 8,
    gap: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  hint: {
    opacity: 0.7,
  },
});
