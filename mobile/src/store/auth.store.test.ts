import { useAuthStore } from './auth.store';
import { Entitlements } from '@/types';

const premiumEntitlements: Entitlements = {
  plan: 'PREMIUM_MONTHLY',
  status: 'ACTIVE',
  isPremium: true,
  features: ['AI_COACH'],
  maxWorkoutPlans: -1,
  maxCustomExercises: -1,
  maxProgressPhotos: -1,
  workoutHistoryDays: -1,
};

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      entitlements: null,
      isAuthenticated: false,
    });
  });

  it('defaults to no entitlements — usePremiumFeature must never assume premium by default', () => {
    expect(useAuthStore.getState().entitlements).toBeNull();
  });

  it('setEntitlements stores the server-verified entitlements as-is', () => {
    useAuthStore.getState().setEntitlements(premiumEntitlements);

    expect(useAuthStore.getState().entitlements).toEqual(premiumEntitlements);
  });

  it('logout clears entitlements along with auth state — a stale premium flag must not survive logout', () => {
    useAuthStore.getState().setEntitlements(premiumEntitlements);
    expect(useAuthStore.getState().entitlements?.isPremium).toBe(true);

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().entitlements).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
