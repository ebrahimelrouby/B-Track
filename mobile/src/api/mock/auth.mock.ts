import { AuthUser } from '@/types';
import { localDb, newId } from './localDb';
import type { RegisterPayload, LoginPayload, ResetPasswordPayload, ForgotPasswordPayload } from '../auth.api';

interface StoredUser {
  id: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string; // plain text is fine for local mock
  firstName: string;
  lastName: string;
  onboardingComplete: boolean;
}

const USERS_KEY = 'mock:users';
const CURRENT_KEY = 'mock:currentUser';
const RESET_TOKENS_KEY = 'mock:resetTokens';

interface StoredResetToken {
  token: string;
  userId: string;
}

function makeTokens(userId: string): Pick<AuthUser, 'accessToken' | 'refreshToken' | 'accessTokenExpiresIn'> {
  return {
    accessToken: `mock-access-${userId}`,
    refreshToken: `mock-refresh-${userId}`,
    accessTokenExpiresIn: 900,
  };
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    onboardingComplete: user.onboardingComplete,
    ...makeTokens(user.id),
  };
}

export const mockAuthApi = {
  register: async (payload: RegisterPayload): Promise<AuthUser> => {
    const users = localDb.getList<StoredUser>(USERS_KEY);
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw { response: { data: { message: 'Email already registered', errorCode: 'AUTH_004' } } };
    }
    const user: StoredUser = {
      id: newId(),
      email: payload.email.toLowerCase(),
      phoneNumber: payload.phoneNumber,
      passwordHash: payload.password,
      firstName: payload.firstName,
      lastName: payload.lastName,
      onboardingComplete: false,
    };
    localDb.append(USERS_KEY, user);
    localDb.set(CURRENT_KEY, user.id);
    return toAuthUser(user);
  },

  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const users = localDb.getList<StoredUser>(USERS_KEY);
    const user = users.find(
      (u) => u.email === payload.email.toLowerCase() && u.passwordHash === payload.password
    );
    if (!user) {
      throw { response: { data: { message: 'Invalid email or password', errorCode: 'AUTH_001' } } };
    }
    localDb.set(CURRENT_KEY, user.id);
    return toAuthUser(user);
  },

  refresh: async (refreshToken: string): Promise<AuthUser> => {
    const userId = localDb.get<string>(CURRENT_KEY);
    if (!userId) throw { response: { data: { message: 'No session', errorCode: 'AUTH_005' } } };
    const users = localDb.getList<StoredUser>(USERS_KEY);
    const user = users.find((u) => u.id === userId);
    if (!user) throw { response: { data: { message: 'User not found' } } };
    return toAuthUser(user);
  },

  logout: async (): Promise<void> => {
    localDb.delete(CURRENT_KEY);
  },

  forgotPassword: async (payload: ForgotPasswordPayload): Promise<void> => {
    const users = localDb.getList<StoredUser>(USERS_KEY);
    const user = 'email' in payload && payload.email
      ? users.find((u) => u.email === payload.email.toLowerCase())
      : users.find((u) => u.phoneNumber === (payload as { phoneNumber: string }).phoneNumber);

    if (user) {
      const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
      const tokens = localDb.getList<StoredResetToken>(RESET_TOKENS_KEY).filter((t) => t.userId !== user.id);
      tokens.push({ token: code, userId: user.id });
      localDb.set(RESET_TOKENS_KEY, tokens);
      console.log(`[mock] Password reset code for ${user.email}: ${code}`);
    }
    // Always resolve — mirrors the real API's anti-enumeration behavior.
  },

  resetPassword: async ({ code, newPassword }: ResetPasswordPayload): Promise<void> => {
    const tokens = localDb.getList<StoredResetToken>(RESET_TOKENS_KEY);
    const match = tokens.find((t) => t.token === code);
    if (!match) {
      throw { response: { data: { message: 'Invalid or expired reset code', errorCode: 'AUTH_006' } } };
    }
    const users = localDb.getList<StoredUser>(USERS_KEY);
    const idx = users.findIndex((u) => u.id === match.userId);
    if (idx !== -1) {
      users[idx].passwordHash = newPassword;
      localDb.set(USERS_KEY, users);
    }
    localDb.set(RESET_TOKENS_KEY, tokens.filter((t) => t.token !== code));
  },

  // Helper used by userMock to mark onboarding done
  markOnboardingComplete: (userId: string): void => {
    const users = localDb.getList<StoredUser>(USERS_KEY);
    const idx = users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      users[idx].onboardingComplete = true;
      localDb.set(USERS_KEY, users);
    }
  },
};
