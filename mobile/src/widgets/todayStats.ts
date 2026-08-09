import apiClient from '@/api/client';
import { userApi } from '@/api/user.api';
import { useAuthStore } from '@/store/auth.store';
import { ApiResponse } from '@/types';

export interface TodayGlanceStats {
  signedIn: boolean;
  caloriesConsumed: number;
  caloriesTarget: number;
  waterMl: number;
  waterTargetMl: number;
  // Steps/sleep have no live data source yet — mirror the same placeholder
  // values the dashboard shows until a health-data integration exists.
  stepsToday: number;
  stepsTarget: number;
  sleepHours: number;
  sleepTargetHours: number;
}

const SIGNED_OUT_STATS: TodayGlanceStats = {
  signedIn: false,
  caloriesConsumed: 0,
  caloriesTarget: 2200,
  waterMl: 0,
  waterTargetMl: 2500,
  stepsToday: 0,
  stepsTarget: 10000,
  sleepHours: 0,
  sleepTargetHours: 8,
};

const todayIso = () => new Date().toISOString().split('T')[0];

interface DiaryEntry {
  servings: number;
  food: { calories: number };
}

/** Shared by the Android/iOS widget data bridges — pulls today's live totals. */
export async function fetchTodayGlanceStats(): Promise<TodayGlanceStats> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return SIGNED_OUT_STATS;

  const date = todayIso();
  const [profileResult, diaryResult, waterResult] = await Promise.allSettled([
    userApi.getMe(),
    apiClient.get<ApiResponse<DiaryEntry[]>>(`/nutrition/diary/${date}`),
    apiClient.get<ApiResponse<number>>(`/water/${date}`),
  ]);

  const profile = profileResult.status === 'fulfilled' ? profileResult.value.profile : undefined;
  const diary = diaryResult.status === 'fulfilled' ? diaryResult.value.data.data ?? [] : [];
  const waterMl = waterResult.status === 'fulfilled' ? waterResult.value.data.data ?? 0 : 0;

  const caloriesConsumed = diary.reduce((sum, e) => sum + e.food.calories * e.servings, 0);

  return {
    signedIn: true,
    caloriesConsumed: Math.round(caloriesConsumed),
    caloriesTarget: profile?.targetCalories ?? 2200,
    waterMl,
    waterTargetMl: profile?.targetWaterMl ?? 2500,
    stepsToday: 6200,
    stepsTarget: profile?.targetSteps ?? 10000,
    sleepHours: 7.5,
    sleepTargetHours: 8,
  };
}
