import { api } from "./client";
import type { AdminUser, AdminUserStats, PagedResponse, ApiResponse } from "@/types";

export interface ListUsersParams {
  search?: string;
  page?: number;
  size?: number;
}

export async function listUsers(params: ListUsersParams = {}): Promise<PagedResponse<AdminUser>> {
  const res = await api.get<ApiResponse<PagedResponse<AdminUser>>>("/admin/users", { params });
  return res.data.data;
}

export async function getUserStats(): Promise<AdminUserStats> {
  const res = await api.get<ApiResponse<AdminUserStats>>("/admin/users/stats");
  return res.data.data;
}
