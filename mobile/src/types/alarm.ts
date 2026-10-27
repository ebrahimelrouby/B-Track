// 0 = Sunday ... 6 = Saturday (matches JS Date#getDay()).
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Alarm {
  id: string;
  time: string; // 'HH:mm', 24h
  repeatDays: Weekday[]; // empty = one-time alarm
  enabled: boolean;
  cycles?: number; // set when created from a sleep-cycle recommendation
  // notifee trigger-notification ids this alarm scheduled, keyed by weekday
  // (or 'once' for a non-repeating alarm), so they can be cancelled/replaced.
  notificationIds: Record<string, string>;
}
