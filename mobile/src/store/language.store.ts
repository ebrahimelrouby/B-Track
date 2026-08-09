import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { I18nManager, Alert } from 'react-native';
import i18n from '@/i18n';

const storage = new MMKV({ id: 'lang-storage' });

export type LangId = 'en' | 'ar';

interface LangState {
  lang: LangId;
  setLang: (l: LangId) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: (storage.getString('lang') as LangId) ?? 'en',
  setLang: (l) => {
    storage.set('lang', l);
    i18n.changeLanguage(l);
    const shouldRTL = l === 'ar';
    if (I18nManager.isRTL !== shouldRTL) {
      I18nManager.forceRTL(shouldRTL);
      Alert.alert(
        l === 'ar' ? 'تغيير الاتجاه' : 'Layout Direction Changed',
        l === 'ar'
          ? 'أعد تشغيل التطبيق لتطبيق اتجاه RTL بالكامل.'
          : 'Restart the app to fully apply the new layout direction.',
      );
    }
    set({ lang: l });
  },
}));
