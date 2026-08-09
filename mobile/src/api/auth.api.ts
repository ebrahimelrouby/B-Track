import { USE_MOCK_API } from '@/constants/config';
import { AuthUser, ApiResponse } from '@/types';
import { mockAuthApi } from './mock/auth.mock';
import apiClient from './client';

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export type ResetPasswordPayload =
  | { email: string; phoneNumber?: never; code: string; newPassword: string }
  | { phoneNumber: string; email?: never; code: string; newPassword: string };

// Exactly one of the two must be set.
export type ForgotPasswordPayload = { email: string; phoneNumber?: never } | { phoneNumber: string; email?: never };

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthUser> =>
    USE_MOCK_API
      ? mockAuthApi.register(payload)
      : apiClient.post<ApiResponse<AuthUser>>('/auth/register', payload).then((r) => r.data.data!),

  login: (payload: LoginPayload): Promise<AuthUser> =>
    USE_MOCK_API
      ? mockAuthApi.login(payload)
      : apiClient.post<ApiResponse<AuthUser>>('/auth/login', payload).then((r) => r.data.data!),

  refresh: (refreshToken: string): Promise<AuthUser> =>
    USE_MOCK_API
      ? mockAuthApi.refresh(refreshToken)
      : apiClient.post<ApiResponse<AuthUser>>('/auth/refresh', { refreshToken }).then((r) => r.data.data!),

  logout: (): Promise<void> =>
    USE_MOCK_API
      ? mockAuthApi.logout()
      : apiClient.post('/auth/logout').then(() => {}),

  forgotPassword: (payload: ForgotPasswordPayload): Promise<void> =>
    USE_MOCK_API
      ? mockAuthApi.forgotPassword(payload)
      : apiClient.post('/auth/forgot-password', payload).then(() => {}),

  resetPassword: (payload: ResetPasswordPayload): Promise<void> =>
    USE_MOCK_API
      ? mockAuthApi.resetPassword(payload)
      : apiClient.post('/auth/reset-password', payload).then(() => {}),
};
