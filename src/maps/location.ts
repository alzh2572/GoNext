import * as Location from 'expo-location';
import type { DecimalDegrees } from '../db/types';

/** Текущие координаты устройства в формате Decimal Degrees. */
export async function getCurrentDecimalDegrees(): Promise<DecimalDegrees> {
  const current = await Location.getForegroundPermissionsAsync();
  const permission =
    current.status === 'granted'
      ? current
      : await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('Нет доступа к геолокации. Разрешите доступ в настройках телефона.');
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}
