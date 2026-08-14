import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, HelperText } from 'react-native-paper';
import type { DecimalDegrees } from '../src/db/types';
import { openPlaceInNavigator, openPlaceOnMap } from '../src/maps/openMap';

type MapActionsProps = {
  dd: DecimalDegrees | null;
  label?: string;
  disabled?: boolean;
};

export function MapActions({ dd, label, disabled }: MapActionsProps) {
  const [busy, setBusy] = useState<'map' | 'nav' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noCoords = !dd;

  const run = async (kind: 'map' | 'nav') => {
    if (!dd) {
      setError('У места нет координат');
      return;
    }

    try {
      setBusy(kind);
      setError(null);
      if (kind === 'map') {
        await openPlaceOnMap(dd, label);
      } else {
        await openPlaceInNavigator(dd, label);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : kind === 'map'
            ? 'Не удалось открыть карту'
            : 'Не удалось открыть навигатор',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <Button
        mode="contained"
        disabled={disabled || noCoords || busy != null}
        loading={busy === 'nav'}
        onPress={() => void run('nav')}
      >
        Открыть в навигаторе
      </Button>
      <Button
        mode="outlined"
        disabled={disabled || noCoords || busy != null}
        loading={busy === 'map'}
        onPress={() => void run('map')}
      >
        Открыть на карте
      </Button>
      {noCoords ? (
        <HelperText type="info">
          Добавьте координаты DD, чтобы открыть карту или навигатор.
        </HelperText>
      ) : null}
      {error ? <HelperText type="error">{error}</HelperText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
});
