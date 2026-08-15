import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ru from './locales/ru.json';
import en from './locales/en.json';

export const LANGUAGE_STORAGE_KEY = 'gonext.language';
export type AppLanguage = 'ru' | 'en';

export function isAppLanguage(value: string): value is AppLanguage {
  return value === 'ru' || value === 'en';
}

export async function initI18n(): Promise<typeof i18n> {
  if (i18n.isInitialized) {
    return i18n;
  }

  let lng: AppLanguage = 'ru';
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isAppLanguage(stored)) {
      lng = stored;
    }
  } catch {
    // оставляем русский по умолчанию
  }

  await i18n.use(initReactI18next).init({
    resources: {
      ru: { translation: ru },
      en: { translation: en },
    },
    lng,
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  return i18n;
}

export async function changeAppLanguage(lng: AppLanguage): Promise<void> {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
}

export default i18n;
