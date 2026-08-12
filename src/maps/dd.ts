import type { DecimalDegrees } from '../db/types';

/** Формат DD для отображения: "55.755800, 37.617300" */
export function formatDd(dd: DecimalDegrees, digits = 6): string {
  return `${dd.latitude.toFixed(digits)}, ${dd.longitude.toFixed(digits)}`;
}

/**
 * Разбор строки Decimal Degrees.
 * Допустимо: "55.7558, 37.6173" или "55.7558 37.6173"
 * (запятая внутри числа тоже допускается: "55,7558, 37,6173")
 */
export function parseDd(value: string): DecimalDegrees | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Сначала пробуем разделить по ", " / ";" / пробелам между двумя числами
  const match = trimmed.match(
    /^\s*([+-]?\d+(?:[.,]\d+)?)\s*[,;\s]\s*([+-]?\d+(?:[.,]\d+)?)\s*$/,
  );

  if (!match) {
    return 'invalid';
  }

  const latitude = Number(match[1].replace(',', '.'));
  const longitude = Number(match[2].replace(',', '.'));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'invalid';
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return 'invalid';
  }

  return { latitude, longitude };
}
