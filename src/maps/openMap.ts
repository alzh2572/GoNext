import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { DecimalDegrees } from '../db/types';

const FALLBACK_MESSAGE =
  'Не удалось открыть карту или навигатор. Установите приложение Карт / Google Maps. Офлайн-карты зависят от этого приложения, GoNext не падает.';

async function openFirstAvailable(urls: string[]): Promise<void> {
  let lastError: unknown;

  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error && lastError.message) {
    throw new Error(FALLBACK_MESSAGE);
  }
  throw new Error(FALLBACK_MESSAGE);
}

/** Открыть точку на карте. Сначала системные схемы, HTTPS — запасной вариант. */
export async function openPlaceOnMap(
  dd: DecimalDegrees,
  label?: string,
): Promise<void> {
  const { latitude, longitude } = dd;
  const encodedLabel = encodeURIComponent(label?.trim() || 'Место');

  const urls =
    Platform.OS === 'ios'
      ? [
          `maps://?ll=${latitude},${longitude}&q=${encodedLabel}`,
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
          `maps://?daddr=${destination}&q=${encodedLabel}&dirflg=d`,
          `http://maps.apple.com/?daddr=${destination}&q=${encodedLabel}&dirflg=d`,
          `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        ]
      : [
          `google.navigation:q=${destination}`,
          `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
          `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
        ];

  await openFirstAvailable(urls);
}
