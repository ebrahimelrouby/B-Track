import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { I18nManager, Alert } from 'react-native';
import RNRestart from 'react-native-restart';
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
      // forceRTL only takes visual effect after the native app process
      // relaunches (it's a Yoga/layout-engine setting read at native launch,
      // not something a JS-only bundle reload can apply) — so this must be a
      // real restart, not DevSettings.reload().
      I18nManager.forceRTL(shouldRTL);
      Alert.alert(
        i18n.t('common.restartRequiredTitle'),
        i18n.t('common.restartRequiredMsg'),
        [
          { text: i18n.t('common.restartLater'), style: 'cancel' },
          { text: i18n.t('common.restartNow'), onPress: () => RNRestart.restart() },
        ],
      );
    }
    set({ lang: l });
  },
}));
