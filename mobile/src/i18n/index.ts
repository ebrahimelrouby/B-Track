import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { MMKV } from 'react-native-mmkv';

import en from './en.json';
import ar from './ar.json';

const storage = new MMKV({ id: 'lang-storage' });
const savedLang = (storage.getString('lang') as 'en' | 'ar') ?? 'en';

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export default i18n;
