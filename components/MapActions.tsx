import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, HelperText } from 'react-native-paper';
import type { DecimalDegrees } from '../src/db/types';
import { openPlaceInNavigator, openPlaceOnMap } from '../src/maps/openMap';

type MapActionsProps = {
  dd: DecimalDegrees | null;
  label?: string;
  disabled?: boolean;
};

export function MapActions({ dd, label, disabled }: MapActionsProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<'map' | 'nav' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const noCoords = !dd;

  const run = async (kind: 'map' | 'nav') => {
    if (!dd) {
      setError(t('maps.noCoordinates'));
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
          : t(kind === 'map' ? 'maps.openMapFailed' : 'maps.openNavFailed'),
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
        {t('maps.openNavigator')}
      </Button>
      <Button
        mode="outlined"
        disabled={disabled || noCoords || busy != null}
        loading={busy === 'map'}
        onPress={() => void run('map')}
      >
        {t('maps.openMap')}
      </Button>
      {noCoords ? (
        <HelperText type="info">{t('maps.needCoordinates')}</HelperText>
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
