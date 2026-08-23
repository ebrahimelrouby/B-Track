jest.mock('./client', () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import apiClient from './client';
import { subscriptionApi } from './subscription.api';

describe('subscriptionApi.verifyPurchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts the receipt to /subscriptions/verify and unwraps the ApiResponse envelope', async () => {
    const entitlements = { plan: 'PREMIUM_ANNUAL', status: 'ACTIVE', isPremium: true, features: [], maxWorkoutPlans: -1, maxCustomExercises: -1, maxProgressPhotos: -1, workoutHistoryDays: -1 };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true, data: entitlements } });

    const result = await subscriptionApi.verifyPurchase({
      platform: 'ios',
      plan: 'annual',
      receiptData: 'jws-receipt',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/subscriptions/verify', {
      platform: 'ios',
      plan: 'annual',
      receiptData: 'jws-receipt',
    });
    expect(result).toEqual(entitlements);
  });

  it('propagates a rejected request instead of swallowing verification failures', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('network down'));

    await expect(
      subscriptionApi.verifyPurchase({ platform: 'android', plan: 'monthly', purchaseToken: 'tok' })
    ).rejects.toThrow('network down');
  });
});
