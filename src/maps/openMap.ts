import { Linking, Platform } from 'react-native';
import type { DecimalDegrees } from '../db/types';

/** Открыть точку на карте (Google Maps / Apple Maps / geo:). */
export async function openPlaceOnMap(
  dd: DecimalDegrees,
  label?: string,
): Promise<void> {
  const { latitude, longitude } = dd;
  const encodedLabel = encodeURIComponent(label?.trim() || 'Место');

  const urls =
    Platform.OS === 'ios'
      ? [
          `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`,
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        ]
      : [
          `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
          `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        ];

  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // пробуем следующий URL
    }
  }

  await Linking.openURL(
    `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  );
}
