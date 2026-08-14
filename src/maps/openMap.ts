import { Linking, Platform } from 'react-native';
import type { DecimalDegrees } from '../db/types';

async function openFirstAvailable(urls: string[]): Promise<void> {
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

  await Linking.openURL(urls[urls.length - 1]);
}

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

  await openFirstAvailable(urls);
}

/** Построить маршрут до точки в навигаторе. */
export async function openPlaceInNavigator(
  dd: DecimalDegrees,
  label?: string,
): Promise<void> {
  const { latitude, longitude } = dd;
  const encodedLabel = encodeURIComponent(label?.trim() || 'Место');
  const destination = `${latitude},${longitude}`;

  const urls =
    Platform.OS === 'ios'
      ? [
          `http://maps.apple.com/?daddr=${destination}&q=${encodedLabel}&dirflg=d`,
          `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        ]
      : [
          `google.navigation:q=${destination}`,
          `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        ];

  await openFirstAvailable(urls);
}
