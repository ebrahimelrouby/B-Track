import { localDb, newId } from './localDb';
import {
  RecoveryScore, RecoveryCheckIn, RecoveryCheckInRequest,
  RecoveryLevel, RecoveryComponent, RecoveryComponentBreakdown,
} from '@/types';

const DISCLAIMER =
  'This recovery score is an estimate for fitness tracking only and is not medical advice.';

// ─── Deterministic score generation from a date seed ─────────────────────────
function seedFromDate(dateStr: string): number {
  const [, , day] = dateStr.split('-').map(Number);
  return day;
}

function getLevel(score: number): RecoveryLevel {
  if (score >= 85) return 'READY_FOR_HEAVY_TRAINING';
  if (score >= 70) return 'READY_FOR_NORMAL_TRAINING';
  if (score >= 55) return 'MODERATE_TRAINING_RECOMMENDED';
  if (score >= 40) return 'LIGHT_ACTIVITY_RECOMMENDED';
  return 'REST_RECOMMENDED';
}

function componentStatus(score: number) {
  if (score >= 85) return 'EXCELLENT' as const;
  if (score >= 70) return 'GOOD' as const;
  if (score >= 55) return 'FAIR' as const;
  return 'POOR' as const;
}

function mockComponents(seed: number, isToday: boolean): RecoveryComponentBreakdown {
  const sleepS      = 55 + ((seed * 11) % 40);
  const trainS      = 50 + ((seed * 7)  % 45);
  const heartS      = 70; // always unknown until HealthKit wired
  const hydrationS  = 60 + ((seed * 13) % 35);
  const wellnessS   = isToday ? 65 : 60 + ((seed * 17) % 35);

  const sleep: RecoveryComponent = {
    score: sleepS,
    status: componentStatus(sleepS),
    explanation: sleepS >= 80
      ? 'You slept 7h 55m — close to your 8h target.'
      : sleepS >= 65
      ? 'You slept 6h 45m, about 75 minutes below your target.'
      : 'You slept less than 6 hours. Sleep is the most important recovery factor.',
    confidence: 0.90,
  };

  const trainingLoad: RecoveryComponent = {
    score: trainS,
    status: componentStatus(trainS),
    explanation: trainS >= 80
      ? '2 days since your last workout. Training load is manageable.'
      : trainS >= 60
      ? 'You trained yesterday. Moderate fatigue is expected — key recovery day.'
      : 'High training volume this week. Consider reducing intensity today.',
    confidence: 0.85,
  };

  const heartRecovery: RecoveryComponent = {
    score: heartS,
    status: 'UNKNOWN',
    explanation: 'Heart rate data is unavailable. Connect Apple Health or Health Connect for accurate heart recovery scoring.',
    confidence: 0.30,
  };

  const hydration: RecoveryComponent = {
    score: hydrationS,
    status: componentStatus(hydrationS),
    explanation: hydrationS >= 85
      ? 'You met your 2500ml hydration goal yesterday.'
      : `You reached ${Math.round(hydrationS)}% of your 2500ml hydration goal yesterday.`,
    confidence: 0.80,
  };

  const subjectiveWellness: RecoveryComponent = {
    score: wellnessS,
    status: isToday ? 'UNKNOWN' : componentStatus(wellnessS),
    explanation: isToday
      ? 'No daily check-in for today. Complete your check-in for a more personalised recovery score.'
      : `Based on your check-in: energy ${3 + (seed % 2)}/5, soreness ${2 + (seed % 2)}/5, mood 4/5.`,
    confidence: isToday ? 0.30 : 1.00,
  };

  return { sleep, trainingLoad, heartRecovery, hydration, subjectiveWellness };
}

function mockScore(dateStr: string, isToday = false): RecoveryScore {
  const seed = seedFromDate(dateStr);
  const c    = mockComponents(seed, isToday);

  const raw =
    c.sleep.score              * 0.35 +
    c.trainingLoad.score       * 0.25 +
    c.heartRecovery.score      * 0.20 +
    c.hydration.score          * 0.10 +
    c.subjectiveWellness.score * 0.10;
  const finalScore = Math.round(Math.max(0, Math.min(100, raw)));
  const level      = getLevel(finalScore);

  const missing: string[] = [
    'Resting heart rate data unavailable — connect a health platform to unlock this component.',
  ];
  if (isToday) missing.push('Daily check-in not completed');

  const levelLabel = {
    READY_FOR_HEAVY_TRAINING:       'Ready for heavy training',
    READY_FOR_NORMAL_TRAINING:      'Ready for normal training',
    MODERATE_TRAINING_RECOMMENDED:  'Normal training is suitable',
    LIGHT_ACTIVITY_RECOMMENDED:     'Light activity recommended',
    REST_RECOMMENDED:               'Rest today',
  }[level];

  return {
    id:            `rec-${dateStr}`,
    date:          dateStr,
    recoveryScore: finalScore,
    recoveryLevel: level,
    confidence:    0.72,
    components:    c,
    recommendations: [
      {
        id:          `rec-r1-${dateStr}`,
        type:        'TRAINING',
        title:       levelLabel,
        description: finalScore >= 85
          ? 'Recovery looks excellent. You can follow your planned workout at full intensity.'
          : finalScore >= 70
          ? 'Proceed with your planned workout but avoid adding extra volume today.'
          : finalScore >= 55
          ? 'Consider reducing intensity by 10–15% and focusing on form.'
          : 'A light walk, yoga, or mobility work would be more beneficial than a hard session.',
        priority:    1,
      },
      {
        id:          `rec-r2-${dateStr}`,
        type:        'HYDRATION',
        title:       'Improve hydration before training',
        description: 'Drink at least 500ml of water in the 60 minutes before your workout today.',
        priority:    2,
      },
      {
        id:          `rec-r3-${dateStr}`,
        type:        'GENERAL',
        title:       'Complete your daily check-in',
        description: 'A 30-second check-in improves your recovery score accuracy significantly.',
        priority:    3,
      },
    ],
    missingData: missing,
    disclaimer:  DISCLAIMER,
  };
}

// Pre-build today + 29 days of history
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function dateStrDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const CHECK_IN_KEY = 'recovery:checkIns';

export const recoveryMock = {
  getToday: async (): Promise<RecoveryScore> => {
    const today = todayStr();
    const existing = localDb.getList<RecoveryScore>('recovery:scores')
      .find(s => s.date === today);
    if (existing) return existing;

    const score = mockScore(today, true);
    localDb.append('recovery:scores', score);
    return score;
  },

  getByDate: async (date: string): Promise<RecoveryScore> => {
    const existing = localDb.getList<RecoveryScore>('recovery:scores').find(s => s.date === date);
    if (existing) return existing;
    const score = mockScore(date);
    localDb.append('recovery:scores', score);
    return score;
  },

  getHistory: async (): Promise<RecoveryScore[]> => {
    const history: RecoveryScore[] = [];
    for (let i = 0; i < 30; i++) {
      const d    = dateStrDaysAgo(i);
      const item = mockScore(d, i === 0);
      history.push(item);
    }
    return history;
  },

  recalculate: async (): Promise<RecoveryScore> => {
    const today = todayStr();
    const score = mockScore(today, true);
    const list  = localDb.getList<RecoveryScore>('recovery:scores').filter(s => s.date !== today);
    list.unshift(score);
    localDb.set('recovery:scores', list);
    return score;
  },

  getTodayCheckIn: async (): Promise<RecoveryCheckIn | null> => {
    const today = todayStr();
    return localDb.getList<RecoveryCheckIn>(CHECK_IN_KEY).find(c => c.date === today) ?? null;
  },

  createCheckIn: async (req: RecoveryCheckInRequest): Promise<RecoveryCheckIn> => {
    const date = req.date ?? todayStr();
    const item: RecoveryCheckIn = {
      id:              newId(),
      date,
      energyLevel:     req.energyLevel,
      sorenessLevel:   req.sorenessLevel,
      stressLevel:     req.stressLevel,
      moodLevel:       req.moodLevel,
      motivationLevel: req.motivationLevel,
      notes:           req.notes,
      createdAt:       new Date().toISOString(),
    };
    localDb.append(CHECK_IN_KEY, item);
    return item;
  },

  updateCheckIn: async (id: string, req: RecoveryCheckInRequest): Promise<RecoveryCheckIn> => {
    const updated = localDb.update<RecoveryCheckIn>(CHECK_IN_KEY, id, {
      energyLevel:     req.energyLevel,
      sorenessLevel:   req.sorenessLevel,
      stressLevel:     req.stressLevel,
      moodLevel:       req.moodLevel,
      motivationLevel: req.motivationLevel,
      notes:           req.notes,
    });
    if (!updated) throw new Error('Check-in not found');
    return updated;
  },
};
