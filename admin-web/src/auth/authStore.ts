import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "@/types";

interface AuthStore extends AuthState {
  login: (data: {
    accessToken: string; refreshToken: string;
    userId: string; email: string; firstName: string;
    lastName: string; role: string;
  }) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      userId: null,
      email: null,
      firstName: null,
      lastName: null,
      role: null,

      login: (data) =>
        set({
          token: data.accessToken,
          refreshToken: data.refreshToken,
          userId: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        }),

      logout: () =>
        set({
          token: null, refreshToken: null, userId: null,
          email: null, firstName: null, lastName: null, role: null,
        }),

      isAuthenticated: () => !!get().token,

      isAdmin: () => {
        const role = get().role;
        return role === "ADMIN" || role === "SUPER_ADMIN";
      },
    }),
    { name: "btrack-admin-auth" }
  )
);
