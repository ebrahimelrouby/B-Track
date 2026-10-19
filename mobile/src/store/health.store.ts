import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'health-storage' });

interface HealthState {
  stepsAuthorized: boolean;
  sleepAuthorized: boolean;
  lastSyncedAt: number | null;
  setAuthorized: (v: boolean) => void;
  setLastSyncedAt: (ts: number) => void;
}

export const useHealthStore = create<HealthState>((set) => ({
  stepsAuthorized: storage.getBoolean('authorized') ?? false,
  sleepAuthorized: storage.getBoolean('authorized') ?? false,
  lastSyncedAt: storage.getNumber('lastSyncedAt') ?? null,
  setAuthorized: (v) => {
    storage.set('authorized', v);
    set({ stepsAuthorized: v, sleepAuthorized: v });
  },
  setLastSyncedAt: (ts) => {
    storage.set('lastSyncedAt', ts);
    set({ lastSyncedAt: ts });
  },
}));
