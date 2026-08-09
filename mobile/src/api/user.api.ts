import { USE_MOCK_API } from '@/constants/config';
import { ApiResponse, UserProfile, Entitlements } from '@/types';
import { mockUserApi } from './mock/user.mock';
import { useAuthStore } from '@/store/auth.store';
import apiClient from './client';

function currentUserId(): string {
  return useAuthStore.getState().user?.userId ?? '';
}

export const userApi = {
  getMe: () =>
    USE_MOCK_API
      ? mockUserApi.getMe(currentUserId())
      : apiClient
          .get<ApiResponse<{ id: string; email: string; firstName: string; lastName: string; onboardingComplete: boolean; profile: UserProfile }>>('/users/me')
          .then((r) => r.data.data!),

  updateProfile: (data: Record<string, any>) =>
    USE_MOCK_API
      ? mockUserApi.updateProfile(currentUserId(), data)
      : apiClient.patch<ApiResponse<unknown>>('/users/me', data).then((r) => r.data.data!),

  getEntitlements: (): Promise<Entitlements> =>
    USE_MOCK_API
      ? mockUserApi.getEntitlements(currentUserId())
      : apiClient.get<ApiResponse<Entitlements>>('/subscriptions/entitlements').then((r) => r.data.data!),
};
