import {
  getSdkStatus,
  initialize,
  requestPermission,
  readRecords,
  SdkAvailabilityStatus,
  SleepStageType,
} from 'react-native-health-connect';

import { DailySleepSample, DailyStepsSample, HealthService } from './types';

const ASLEEP_STAGES = new Set<number>([SleepStageType.SLEEPING, SleepStageType.LIGHT, SleepStageType.DEEP, SleepStageType.REM]);

function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

let initPromise: Promise<boolean> | null = null;

async function ensureInitialized(): Promise<boolean> {
  if (!initPromise) {
    initPromise = (async () => {
      const status = await getSdkStatus();
      if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
      return initialize();
    })();
  }
  return initPromise;
}

async function isAvailable(): Promise<boolean> {
  return ensureInitialized();
}

async function requestAuthorization(): Promise<boolean> {
  const ready = await ensureInitialized();
  if (!ready) return false;
  const granted = await requestPermission([
    { accessType: 'read', recordType: 'Steps' },
    { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
    { accessType: 'read', recordType: 'SleepSession' },
  ]);
  return granted.length > 0;
}

async function getStepsHistory(days: number): Promise<DailyStepsSample[]> {
  const ready = await ensureInitialized();
  if (!ready) return [];

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);
  const timeRangeFilter = { operator: 'between' as const, startTime: start.toISOString(), endTime: end.toISOString() };

  const [{ records: stepRecords }, { records: calorieRecords }] = await Promise.all([
    readRecords('Steps', { timeRangeFilter }),
    // Active-energy burned — this is what a paired Wear OS / smartwatch
    // actually contributes on top of the phone's own step-counting sensor.
    readRecords('ActiveCaloriesBurned', { timeRangeFilter }),
  ]);

  const stepsByDate = new Map<string, number>();
  for (const r of stepRecords) {
    const key = ymd(new Date(r.startTime));
    stepsByDate.set(key, (stepsByDate.get(key) ?? 0) + r.count);
  }

  const caloriesByDate = new Map<string, number>();
  for (const r of calorieRecords) {
    const key = ymd(new Date(r.startTime));
    caloriesByDate.set(key, (caloriesByDate.get(key) ?? 0) + r.energy.inKilocalories);
  }

  return Array.from(stepsByDate.entries()).map(([date, steps]) => ({
    date,
    steps: Math.round(steps),
    caloriesBurned: caloriesByDate.has(date) ? Math.round(caloriesByDate.get(date)!) : undefined,
  }));
}

async function getSleepHistory(days: number): Promise<DailySleepSample[]> {
  const ready = await ensureInitialized();
  if (!ready) return [];

  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);

  const { records } = await readRecords('SleepSession', {
    timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() },
  });

  return records.map(r => {
    const bed = new Date(r.startTime);
    const wake = new Date(r.endTime);
    const stages = r.stages ?? [];
    const minutes = stages.length > 0
      ? stages
          .filter(s => ASLEEP_STAGES.has(s.stage))
          .reduce((sum, s) => sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60_000, 0)
      : (wake.getTime() - bed.getTime()) / 60_000;

    return {
      date: ymd(wake),
      bedtime: bed.toISOString(),
      wakeTime: wake.toISOString(),
      totalMinutes: Math.round(minutes),
    };
  });
}

export const healthService: HealthService = {
  isAvailable,
  requestAuthorization,
  getStepsHistory,
  getSleepHistory,
};
