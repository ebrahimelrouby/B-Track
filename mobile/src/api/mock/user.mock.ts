import { UserProfile, Entitlements } from '@/types';
import { localDb } from './localDb';
import { mockAuthApi } from './auth.mock';

const USERS_LIST_KEY = 'mock:users';

const PROFILE_KEY = (userId: string) => `mock:profile:${userId}`;

function calculateMacros(profile: Partial<UserProfile> & { dateOfBirth?: string }): Partial<UserProfile> {
  const { weightKg, heightCm, dateOfBirth, gender, activityLevel, fitnessGoal } = profile as any;
  if (!weightKg || !heightCm || !dateOfBirth || !activityLevel || !fitnessGoal) return {};

  const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
  const bmr =
    gender === 'FEMALE'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
      : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;

  const multipliers: Record<string, number> = {
    SEDENTARY: 1.2, LIGHTLY_ACTIVE: 1.375, MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725, EXTRA_ACTIVE: 1.9,
  };
  const tdee = bmr * (multipliers[activityLevel] ?? 1.4);
  const goalFactor = fitnessGoal === 'LOSE_FAT' ? 0.8 : fitnessGoal === 'GAIN_MUSCLE' ? 1.1 : 1;
  const targetCalories = Math.round(tdee * goalFactor);

  const proteinMult = fitnessGoal === 'LOSE_FAT' ? 2.2 : fitnessGoal === 'GAIN_MUSCLE' ? 2.0 : 1.8;
  const targetProteinG = Math.round(weightKg * proteinMult);
  const targetFatsG = Math.max(40, Math.round(targetCalories * 0.25 / 9));
  const targetCarbsG = Math.max(0, Math.round((targetCalories - targetProteinG * 4 - targetFatsG * 9) / 4));

  return { targetCalories, targetProteinG, targetFatsG, targetCarbsG };
}

export const mockUserApi = {
  getMe: async (userId: string) => {
    const profile = localDb.get<UserProfile>(PROFILE_KEY(userId)) ?? ({} as UserProfile);
    const stored = localDb.getList<any>(USERS_LIST_KEY).find((u: any) => u.id === userId) ?? {};
    return {
      id: userId,
      email: stored.email ?? '',
      firstName: stored.firstName ?? '',
      lastName: stored.lastName ?? '',
      onboardingComplete: stored.onboardingComplete ?? false,
      profile,
    };
  },

  updateProfile: async (userId: string, data: Record<string, any>) => {
    const existing = localDb.get<UserProfile>(PROFILE_KEY(userId)) ?? ({} as UserProfile);
    const macros = calculateMacros({ ...existing, ...data });
    const updated = { ...existing, ...data, ...macros };
    localDb.set(PROFILE_KEY(userId), updated);

    // Mark onboarding complete once key fields are present
    const hasCore = updated.gender && updated.weightKg && updated.heightCm && updated.fitnessGoal;
    if (hasCore) {
      mockAuthApi.markOnboardingComplete(userId);
    }

    return updated;
  },

  getEntitlements: async (_userId: string): Promise<Entitlements> => ({
    plan: 'FREE',
    status: 'ACTIVE',
    isPremium: false,
    features: [],
    maxWorkoutPlans: 3,
    maxCustomExercises: 10,
    maxProgressPhotos: 5,
    workoutHistoryDays: 30,
  }),
};
