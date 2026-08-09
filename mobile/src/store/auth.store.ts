import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { AuthUser, Entitlements } from '@/types';

const storage = new MMKV({ id: 'auth-storage' });

const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  entitlements: Entitlements | null;
  isAuthenticated: boolean;

  setAuth: (user: AuthUser) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setEntitlements: (entitlements: Entitlements) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      entitlements: null,
      isAuthenticated: false,

      setAuth: (user) =>
        set({
          user,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          isAuthenticated: true,
        }),

      setTokens: (accessToken, refreshToken) =>
        set((state) => ({
          accessToken,
          refreshToken,
          user: state.user ? { ...state.user, accessToken, refreshToken } : null,
        })),

      setEntitlements: (entitlements) => set({ entitlements }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          entitlements: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        entitlements: state.entitlements,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
