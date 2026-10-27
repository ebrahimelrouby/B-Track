import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { Alarm } from '@/types/alarm';

const storage = new MMKV({ id: 'alarm-storage' });
const KEY = 'alarms';

function load(): Alarm[] {
  const saved = storage.getString(KEY);
  if (!saved) return [];
  try {
    return JSON.parse(saved) as Alarm[];
  } catch {
    return [];
  }
}

function persist(alarms: Alarm[]) {
  storage.set(KEY, JSON.stringify(alarms));
}

interface AlarmState {
  alarms: Alarm[];
  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string, enabled: boolean) => void;
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: load(),
  addAlarm: (alarm) => {
    const alarms = [...get().alarms, alarm];
    persist(alarms);
    set({ alarms });
  },
  updateAlarm: (id, patch) => {
    const alarms = get().alarms.map((a) => (a.id === id ? { ...a, ...patch } : a));
    persist(alarms);
    set({ alarms });
  },
  deleteAlarm: (id) => {
    const alarms = get().alarms.filter((a) => a.id !== id);
    persist(alarms);
    set({ alarms });
  },
  toggleAlarm: (id, enabled) => {
    const alarms = get().alarms.map((a) => (a.id === id ? { ...a, enabled } : a));
    persist(alarms);
    set({ alarms });
  },
}));
