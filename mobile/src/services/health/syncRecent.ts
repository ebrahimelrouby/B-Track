import { healthService } from './healthService';
import { healthApi } from '@/api/health.api';
import { userApi } from '@/api/user.api';
import { SleepQuality } from '@/types';
import { Platform } from 'react-native';

const SYNC_DAYS = 14;
const SOURCE = Platform.OS === 'ios' ? 'apple_health' : 'health_connect';

function sleepQualityFor(totalMinutes: number, targetMinutes: number): SleepQuality {
  const pct = targetMinutes > 0 ? totalMinutes / targetMinutes : 0;
  if (pct >= 1.1) return 'EXCELLENT';
  if (pct >= 0.9) return 'GOOD';
  if (pct >= 0.7) return 'FAIR';
  return 'POOR';
}

export async function syncRecentHealthData(): Promise<void> {
  const [me, steps, sleep] = await Promise.all([
    userApi.getMe(),
    healthService.getStepsHistory(SYNC_DAYS),
    healthService.getSleepHistory(SYNC_DAYS),
  ]);

  const targetMinutes = (me.profile?.targetSleepHours ?? 8) * 60;

  for (const day of steps) {
    await healthApi.logSteps({ date: day.date, steps: day.steps, caloriesBurned: day.caloriesBurned, source: SOURCE });
  }

  for (const night of sleep) {
    await healthApi.logSleep({
      date: night.date,
      bedtime: night.bedtime,
      wakeTime: night.wakeTime,
      quality: sleepQualityFor(night.totalMinutes, targetMinutes),
      source: SOURCE,
    });
  }
}
