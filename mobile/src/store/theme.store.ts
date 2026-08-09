import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'theme-storage' });

export type ThemeId = 'dark' | 'orange' | 'light' | 'pink' | 'azure' | 'midnight';

interface ThemeState {
  theme: ThemeId;
  isDark: boolean;
  setTheme: (t: ThemeId) => void;
  toggle: () => void;
}

function load(): ThemeId {
  const saved = storage.getString('theme') as ThemeId | undefined;
  if (saved === 'dark' || saved === 'orange' || saved === 'light' || saved === 'pink' || saved === 'azure' || saved === 'midnight') return saved;
  return (storage.getBoolean('isDark') ?? true) ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: load(),
  isDark: load() !== 'light',
  setTheme: (t) => {
    storage.set('theme', t);
    set({ theme: t, isDark: t !== 'light' });
  },
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    storage.set('theme', next);
    set({ theme: next, isDark: next !== 'light' });
  },
}));
