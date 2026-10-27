import { MMKV } from 'react-native-mmkv';

// Bridges a notification press to in-app navigation when it happens while
// the JS context isn't mounted yet (app backgrounded/killed) — notifee's
// background handler (registered in index.js, outside the React tree) has
// no navigator to call, so it stashes the alarm id here; App.tsx picks it
// up once mounted.
const storage = new MMKV({ id: 'alarm-storage' });
const KEY = 'pendingAlarmId';

export function setPendingAlarmId(alarmId: string): void {
  storage.set(KEY, alarmId);
}

export function takePendingAlarmId(): string | undefined {
  const id = storage.getString(KEY);
  if (id) storage.delete(KEY);
  return id;
}
