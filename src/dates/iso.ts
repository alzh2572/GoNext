import i18n from '../i18n';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function getDateLocale(): string {
  return i18n.language?.startsWith('en') ? 'en-US' : 'ru-RU';
}

export function parseIsoDate(value: string): string | null | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!ISO_DATE.test(trimmed)) {
    return 'invalid';
  }
  const date = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return 'invalid';
  }
  return trimmed;
}

export function formatIsoDate(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(getDateLocale());
}

export function formatTripPeriod(
  startDate: string | null,
  endDate: string | null,
): string {
  if (!startDate && !endDate) {
    return i18n.t('trips.noDates');
  }
  if (startDate && endDate) {
    return `${formatIsoDate(startDate)} — ${formatIsoDate(endDate)}`;
  }
  if (startDate) {
    return i18n.t('trips.fromDate', { date: formatIsoDate(startDate) });
  }
  return i18n.t('trips.untilDate', { date: formatIsoDate(endDate) });
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}
