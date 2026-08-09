import { DailySleep, DailySteps, SleepLog, SleepLogRequest, StepsLogRequest, SleepQuality } from '@/types';

function today() {
  return new Date().toISOString().split('T')[0];
}

function pastDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function qualityFromMinutes(mins: number): SleepQuality {
  if (mins >= 480) return 'EXCELLENT';
  if (mins >= 420) return 'GOOD';
  if (mins >= 360) return 'FAIR';
  return 'POOR';
}

// ─── Sleep mock ───────────────────────────────────────────────────────────────

const SLEEP_HISTORY: DailySleep[] = Array.from({ length: 14 }, (_, i) => {
  const seed     = ((i * 7 + 13) % 17);
  const mins     = 300 + seed * 15; // 300–555 min
  const quality  = qualityFromMinutes(mins);
  const date     = pastDate(i);
  const bedHour  = 22 + (seed % 3);
  const bedDate  = new Date(date + 'T' + String(bedHour).padStart(2, '0') + ':30:00');
  const wakeDate = new Date(bedDate.getTime() + mins * 60 * 1000);
  const log: SleepLog = {
    id: uid(),
    date,
    bedtime: bedDate.toISOString(),
    wakeTime: wakeDate.toISOString(),
    durationMinutes: mins,
    quality,
    createdAt: date + 'T07:00:00Z',
  };
  return {
    date,
    logs: [log],
    totalMinutes: mins,
    targetMinutes: 480,
    quality,
  };
});

// ─── Steps mock ───────────────────────────────────────────────────────────────

const STEPS_HISTORY: DailySteps[] = Array.from({ length: 14 }, (_, i) => {
  const seed  = (i * 11 + 7) % 19;
  const steps = 4000 + seed * 400;
  return {
    date: pastDate(i),
    steps,
    targetSteps: 10000,
    distanceKm:  parseFloat((steps * 0.00075).toFixed(2)),
    caloriesBurned: Math.round(steps * 0.04),
    activeMinutes: Math.round(steps / 110),
  };
});

// ─── In-memory overrides (for new logs in this session) ───────────────────────

let sleepOverride: DailySleep | null = null;
let stepsOverride: DailySteps | null = null;

// ─── API ─────────────────────────────────────────────────────────────────────

export const healthMock = {
  // Sleep
  getSleepToday: async (): Promise<DailySleep> => {
    if (sleepOverride) return sleepOverride;
    return SLEEP_HISTORY[0] ?? {
      date: today(),
      logs: [],
      totalMinutes: 0,
      targetMinutes: 480,
      quality: null,
    };
  },

  getSleepHistory: async (days = 14): Promise<DailySleep[]> => {
    const override = sleepOverride ? [sleepOverride, ...SLEEP_HISTORY.slice(1, days)] : SLEEP_HISTORY.slice(0, days);
    return override;
  },

  logSleep: async (req: SleepLogRequest): Promise<SleepLog> => {
    const bed  = new Date(req.bedtime);
    const wake = new Date(req.wakeTime);
    const mins = Math.round((wake.getTime() - bed.getTime()) / 60000);
    const log: SleepLog = {
      id: uid(),
      date: req.date,
      bedtime: req.bedtime,
      wakeTime: req.wakeTime,
      durationMinutes: mins,
      quality: req.quality,
      notes: req.notes,
      createdAt: new Date().toISOString(),
    };
    sleepOverride = {
      date: req.date,
      logs: [log],
      totalMinutes: mins,
      targetMinutes: 480,
      quality: req.quality,
    };
    return log;
  },

  deleteSleepLog: async (_id: string): Promise<void> => {
    sleepOverride = {
      date: today(),
      logs: [],
      totalMinutes: 0,
      targetMinutes: 480,
      quality: null,
    };
  },

  // Steps
  getStepsToday: async (): Promise<DailySteps> => {
    if (stepsOverride) return stepsOverride;
    return STEPS_HISTORY[0] ?? {
      date: today(),
      steps: 0,
      targetSteps: 10000,
      distanceKm: 0,
      caloriesBurned: 0,
      activeMinutes: 0,
    };
  },

  getStepsHistory: async (days = 14): Promise<DailySteps[]> => {
    const override = stepsOverride ? [stepsOverride, ...STEPS_HISTORY.slice(1, days)] : STEPS_HISTORY.slice(0, days);
    return override;
  },

  logSteps: async (req: StepsLogRequest): Promise<DailySteps> => {
    const entry: DailySteps = {
      date: req.date,
      steps: req.steps,
      targetSteps: 10000,
      distanceKm: parseFloat((req.steps * 0.00075).toFixed(2)),
      caloriesBurned: Math.round(req.steps * 0.04),
      activeMinutes: Math.round(req.steps / 110),
    };
    stepsOverride = entry;
    return entry;
  },
};
