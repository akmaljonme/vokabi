import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';
import kaa from './locales/kaa.json';

export const SUPPORTED_UI_LANGUAGES = ['uz', 'ru', 'en', 'kaa'] as const;
export type UILanguage = typeof SUPPORTED_UI_LANGUAGES[number];

export const UI_LANGUAGE_LABELS: Record<UILanguage, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
  kaa: 'Qaraqalpaqsha',
};

export const UI_LANGUAGE_FLAGS: Record<UILanguage, string> = {
  uz: '🇺🇿',
  ru: '🇷🇺',
  en: '🇬🇧',
  kaa: '🇺🇿',
};

// LocalStorage kaliti — vokabi_prefs (target_language) bilan aralashmasligi uchun alohida
export const UI_LANGUAGE_STORAGE_KEY = 'vokabi_ui_language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      uz: { translation: uz },
      ru: { translation: ru },
      en: { translation: en },
      kaa: { translation: kaa },
    },
    fallbackLng: 'uz',
    supportedLngs: SUPPORTED_UI_LANGUAGES as unknown as string[],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: UI_LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
