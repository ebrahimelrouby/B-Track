import notifee, {
  AndroidImportance,
  IntervalTrigger,
  TimeUnit,
  TriggerType,
} from 'react-native-notify-kit';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'water-reminder-storage' });
const ANDROID_CHANNEL_ID = 'water-reminders';

export interface WaterReminderSettings {
  enabled: boolean;
  intervalHours: number;
  notificationId?: string;
}

const DEFAULT_SETTINGS: WaterReminderSettings = { enabled: false, intervalHours: 1 };

function keyFor(userId: string): string {
  return `waterReminder:${userId}`;
}

export function loadWaterReminderSettings(userId: string): WaterReminderSettings {
  try {
    const raw = storage.getString(keyFor(userId));
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveWaterReminderSettings(userId: string, settings: WaterReminderSettings): void {
  storage.set(keyFor(userId), JSON.stringify(settings));
}

let channelReady: Promise<void> | null = null;
async function ensureAndroidChannel(): Promise<void> {
  if (!channelReady) {
    channelReady = notifee
      .createChannel({ id: ANDROID_CHANNEL_ID, name: 'Water Reminders', importance: AndroidImportance.DEFAULT })
      .then(() => undefined);
  }
  return channelReady;
}

export async function requestWaterReminderPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function enableWaterReminder(userId: string, intervalHours: number): Promise<WaterReminderSettings> {
  await ensureAndroidChannel();
  await disableWaterReminder(userId);

  const trigger: IntervalTrigger = {
    type: TriggerType.INTERVAL,
    interval: intervalHours,
    timeUnit: TimeUnit.HOURS,
  };

  const notificationId = await notifee.createTriggerNotification(
    {
      title: 'Time to hydrate 💧',
      body: `It's been ${intervalHours}h — log some water to stay on track today.`,
      android: { channelId: ANDROID_CHANNEL_ID, pressAction: { id: 'default' } },
      ios: { sound: 'default' },
    },
    trigger,
  );

  const settings: WaterReminderSettings = { enabled: true, intervalHours, notificationId };
  saveWaterReminderSettings(userId, settings);
  return settings;
}

export async function disableWaterReminder(userId: string): Promise<void> {
  const current = loadWaterReminderSettings(userId);
  if (current.notificationId) {
    await notifee.cancelTriggerNotification(current.notificationId);
  }
  saveWaterReminderSettings(userId, { ...current, enabled: false, notificationId: undefined });
}
