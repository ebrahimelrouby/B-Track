import notifee, {
  AndroidCategory,
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from 'react-native-notify-kit';
import { Alarm, Weekday } from '@/types/alarm';

const ANDROID_CHANNEL_ID = 'alarms';
const ALARM_SOUND = 'alarm.wav';

let channelReady: Promise<void> | null = null;

async function ensureAndroidChannel(): Promise<void> {
  if (!channelReady) {
    channelReady = notifee
      .createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'Alarms',
        importance: AndroidImportance.HIGH,
        sound: 'alarm',
      })
      .then(() => undefined);
  }
  return channelReady;
}

export async function requestAlarmPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

// Next Date/time matching the given weekday + 'HH:mm', always in the future
// (rolls to next week if today's occurrence already passed).
function nextOccurrence(time: string, weekday: Weekday): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);

  let dayDelta = (weekday - now.getDay() + 7) % 7;
  if (dayDelta === 0 && date <= now) dayDelta = 7;
  date.setDate(date.getDate() + dayDelta);
  return date;
}

// Next Date/time for a one-off alarm (today if still in the future, else tomorrow).
function nextOneOff(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  if (date <= new Date()) date.setDate(date.getDate() + 1);
  return date;
}

async function createAlarmNotification(alarm: Alarm, timestamp: Date): Promise<string> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: timestamp.getTime(),
    repeatFrequency: alarm.repeatDays.length > 0 ? RepeatFrequency.WEEKLY : undefined,
  };

  return notifee.createTriggerNotification(
    {
      title: 'Alarm',
      body: alarm.cycles ? `Based on ${alarm.cycles} sleep cycles` : 'Time to wake up',
      data: { alarmId: alarm.id },
      android: {
        channelId: ANDROID_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        sound: 'alarm',
        pressAction: { id: 'default' },
        fullScreenAction: { id: 'default' },
      },
      ios: {
        sound: ALARM_SOUND,
        critical: false,
      },
    },
    trigger
  );
}

export async function scheduleAlarm(alarm: Alarm): Promise<Record<string, string>> {
  await ensureAndroidChannel();
  await cancelAlarm(alarm);

  const notificationIds: Record<string, string> = {};

  if (alarm.repeatDays.length === 0) {
    notificationIds.once = await createAlarmNotification(alarm, nextOneOff(alarm.time));
  } else {
    for (const weekday of alarm.repeatDays) {
      notificationIds[String(weekday)] = await createAlarmNotification(
        alarm,
        nextOccurrence(alarm.time, weekday)
      );
    }
  }

  return notificationIds;
}

export async function cancelAlarm(alarm: Alarm): Promise<void> {
  const ids = Object.values(alarm.notificationIds ?? {});
  await Promise.all(ids.map((id) => notifee.cancelTriggerNotification(id)));
}
