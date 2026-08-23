import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "./authStore";

const loginPayload = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  userId: "user-1",
  email: "admin@btrack.dev",
  firstName: "Ada",
  lastName: "Admin",
  role: "ADMIN",
};

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      token: null,
      refreshToken: null,
      userId: null,
      email: null,
      firstName: null,
      lastName: null,
      role: null,
    });
  });

  it("is not authenticated with no token", () => {
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });

  it("login populates state and flips isAuthenticated", () => {
    useAuthStore.getState().login(loginPayload);

    expect(useAuthStore.getState().token).toBe("access-token");
    expect(useAuthStore.getState().email).toBe("admin@btrack.dev");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
  });

  it("isAdmin is true for ADMIN and SUPER_ADMIN, false otherwise", () => {
    useAuthStore.getState().login({ ...loginPayload, role: "ADMIN" });
    expect(useAuthStore.getState().isAdmin()).toBe(true);

    useAuthStore.getState().login({ ...loginPayload, role: "SUPER_ADMIN" });
    expect(useAuthStore.getState().isAdmin()).toBe(true);

    useAuthStore.getState().login({ ...loginPayload, role: "USER" });
    expect(useAuthStore.getState().isAdmin()).toBe(false);
  });

  it("logout clears all auth state — a stale token must not survive logout", () => {
    useAuthStore.getState().login(loginPayload);
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
  });
});
