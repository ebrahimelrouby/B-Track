import { ApiResponse, Entitlements } from '@/types';
import apiClient from './client';

export interface VerifyPurchaseRequest {
  platform: 'ios' | 'android';
  plan: 'monthly' | 'annual';
  purchaseToken?: string;  // Android
  receiptData?: string;    // iOS — the StoreKit 2 signed transaction
}

// IAP verification always needs the real backend — there's no meaningful way
// to fake a store receipt locally, so this ignores USE_MOCK_API.
export const subscriptionApi = {
  verifyPurchase: (request: VerifyPurchaseRequest): Promise<Entitlements> =>
    apiClient.post<ApiResponse<Entitlements>>('/subscriptions/verify', request).then((r) => r.data.data!),
};
