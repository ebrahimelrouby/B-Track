export interface DailyStepsSample {
  date: string; // YYYY-MM-DD
  steps: number;
  caloriesBurned?: number; // active-energy burned, from watch/phone sensors when available
}

export interface DailySleepSample {
  date: string; // YYYY-MM-DD — the wake-up date, matching how manual entries were dated
  bedtime: string; // ISO datetime
  wakeTime: string; // ISO datetime
  totalMinutes: number;
}

export interface HealthService {
  isAvailable(): Promise<boolean>;
  requestAuthorization(): Promise<boolean>;
  getStepsHistory(days: number): Promise<DailyStepsSample[]>;
  getSleepHistory(days: number): Promise<DailySleepSample[]>;
}
