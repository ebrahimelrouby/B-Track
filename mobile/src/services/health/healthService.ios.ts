import {
  isHealthDataAvailableAsync,
  requestAuthorization as hkRequestAuthorization,
  queryStatisticsCollectionForQuantity,
  queryCategorySamples,
  CategoryValueSleepAnalysis,
} from '@kingstinct/react-native-healthkit';

import { DailySleepSample, DailyStepsSample, HealthService } from './types';

const ASLEEP_VALUES = new Set<number>([
  CategoryValueSleepAnalysis.asleepUnspecified,
  CategoryValueSleepAnalysis.asleepCore,
  CategoryValueSleepAnalysis.asleepDeep,
  CategoryValueSleepAnalysis.asleepREM,
]);

function ymd(d: Date): string {
  return d.toISOString().split('T')[0];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function isAvailable(): Promise<boolean> {
  return isHealthDataAvailableAsync();
}

async function requestAuthorization(): Promise<boolean> {
  return hkRequestAuthorization({
    toRead: [
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierActiveEnergyBurned',
      'HKCategoryTypeIdentifierSleepAnalysis',
    ],
  });
}

async function getStepsHistory(days: number): Promise<DailyStepsSample[]> {
  const end = new Date();
  const start = startOfDay(new Date(end.getTime() - (days - 1) * 86_400_000));
  const dateFilter = { filter: { date: { startDate: start, endDate: end } } };

  const [stepBuckets, calorieBuckets] = await Promise.all([
    queryStatisticsCollectionForQuantity(
      'HKQuantityTypeIdentifierStepCount',
      ['cumulativeSum'],
      start,
      { day: 1 },
      { unit: 'count', ...dateFilter },
    ),
    // Active-energy burned — this is what a paired Apple Watch actually
    // contributes on top of the phone's own step-counting sensor.
    queryStatisticsCollectionForQuantity(
      'HKQuantityTypeIdentifierActiveEnergyBurned',
      ['cumulativeSum'],
      start,
      { day: 1 },
      { unit: 'kcal', ...dateFilter },
    ),
  ]);

  const caloriesByDate = new Map<string, number>();
  for (const b of calorieBuckets) {
    if (!b.startDate || !b.sumQuantity) continue;
    caloriesByDate.set(ymd(b.startDate), Math.round(b.sumQuantity.quantity));
  }

  return stepBuckets
    .filter(b => b.startDate && (b.sumQuantity?.quantity ?? 0) > 0)
    .map(b => {
      const date = ymd(b.startDate as Date);
      return {
        date,
        steps: Math.round(b.sumQuantity!.quantity),
        caloriesBurned: caloriesByDate.get(date),
      };
    });
}

async function getSleepHistory(days: number): Promise<DailySleepSample[]> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86_400_000);

  const samples = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', {
    limit: 0,
    ascending: true,
    filter: { date: { startDate: start, endDate: end } },
  });

  // A night's sleep is bucketed by its wake-up date, matching how the old
  // manual-entry flow dated a sleep log (submitted the morning after).
  const byDate = new Map<string, { start: Date; end: Date }[]>();
  for (const s of samples) {
    if (!ASLEEP_VALUES.has(s.value as unknown as number)) continue;
    const key = ymd(s.endDate);
    const list = byDate.get(key) ?? [];
    list.push({ start: s.startDate, end: s.endDate });
    byDate.set(key, list);
  }

  const result: DailySleepSample[] = [];
  for (const [date, intervals] of byDate.entries()) {
    // HealthKit can report overlapping "asleep" samples for the same night
    // from multiple sources (iPhone + Apple Watch both tracking the same
    // sleep) — summing each sample's duration independently double- or
    // triple-counts that overlap. Merge into non-overlapping intervals
    // first so the total only counts real elapsed time once.
    intervals.sort((a, b) => a.start.getTime() - b.start.getTime());
    const merged: { start: Date; end: Date }[] = [];
    for (const iv of intervals) {
      const last = merged[merged.length - 1];
      if (last && iv.start.getTime() <= last.end.getTime()) {
        if (iv.end.getTime() > last.end.getTime()) last.end = iv.end;
      } else {
        merged.push({ ...iv });
      }
    }
    const bed = merged[0].start;
    const wake = merged[merged.length - 1].end;
    const minutes = merged.reduce((sum, iv) => sum + (iv.end.getTime() - iv.start.getTime()) / 60_000, 0);
    result.push({ date, bedtime: bed.toISOString(), wakeTime: wake.toISOString(), totalMinutes: Math.round(minutes) });
  }

  return result;
}

export const healthService: HealthService = {
  isAvailable,
  requestAuthorization,
  getStepsHistory,
  getSleepHistory,
};
