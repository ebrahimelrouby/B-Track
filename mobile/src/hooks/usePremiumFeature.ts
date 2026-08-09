import { useAuthStore } from '@/store/auth.store';
import { FeatureKey } from '@/types';

interface PremiumFeatureResult {
  isLocked: boolean;
  isPremium: boolean;
  canAccess: boolean;
}

export function usePremiumFeature(feature: FeatureKey): PremiumFeatureResult {
  const entitlements = useAuthStore((state) => state.entitlements);
  const isPremium = entitlements?.isPremium ?? false;
  const isLocked = !isPremium;
  const canAccess = isPremium;

  return { isLocked, isPremium, canAccess };
}

export function usePlanLimit(resource: 'workout_plans' | 'custom_exercises' | 'progress_photos') {
  const entitlements = useAuthStore((state) => state.entitlements);
  const isPremium = entitlements?.isPremium ?? false;

  const limits: Record<string, number> = {
    workout_plans: entitlements?.maxWorkoutPlans ?? 3,
    custom_exercises: entitlements?.maxCustomExercises ?? 10,
    progress_photos: entitlements?.maxProgressPhotos ?? 5,
  };

  return {
    isPremium,
    limit: limits[resource],
    isUnlimited: isPremium,
  };
}
