import { api } from "./client";
import type {
  Exercise, ExerciseMedia, ExerciseTranslation, ImportHistory,
  AuditLog, DashboardStats, PagedResponse, ApiResponse,
} from "@/types";

// ── Admin Exercise API ────────────────────────────────────────────────────────

export interface ListParams {
  search?: string;
  muscleGroup?: string;
  equipment?: string;
  status?: string;
  provider?: string;
  page?: number;
  size?: number;
}

export async function listExercises(params: ListParams = {}): Promise<PagedResponse<Exercise>> {
  const res = await api.get<ApiResponse<PagedResponse<Exercise>>>("/admin/exercises", { params });
  return res.data.data;
}

export async function getExercise(id: string): Promise<Exercise> {
  const res = await api.get<ApiResponse<Exercise>>(`/admin/exercises/${id}`);
  return res.data.data;
}

export async function createExercise(data: Partial<Exercise>): Promise<Exercise> {
  const res = await api.post<ApiResponse<Exercise>>("/admin/exercises", data);
  return res.data.data;
}

export async function updateExercise(id: string, data: Partial<Exercise>): Promise<Exercise> {
  const res = await api.put<ApiResponse<Exercise>>(`/admin/exercises/${id}`, data);
  return res.data.data;
}

export async function changeExerciseStatus(
  id: string,
  status: string,
  reason?: string
): Promise<Exercise> {
  const res = await api.patch<ApiResponse<Exercise>>(`/admin/exercises/${id}/status`, { status, reason });
  return res.data.data;
}

export async function deleteExercise(id: string): Promise<void> {
  await api.delete(`/admin/exercises/${id}`);
}

export async function bulkChangeStatus(
  exerciseIds: string[],
  status: string,
  reason?: string
): Promise<number> {
  const res = await api.post<ApiResponse<number>>("/admin/exercises/bulk-status", {
    exerciseIds, status, reason,
  });
  return res.data.data;
}

export async function findDuplicates(id: string): Promise<Exercise[]> {
  const res = await api.get<ApiResponse<Exercise[]>>(`/admin/exercises/${id}/duplicates`);
  return res.data.data;
}

// ── Media ─────────────────────────────────────────────────────────────────────

export async function listMedia(exerciseId: string): Promise<ExerciseMedia[]> {
  const res = await api.get<ApiResponse<ExerciseMedia[]>>(`/admin/exercises/${exerciseId}/media`);
  return res.data.data;
}

export async function addMedia(exerciseId: string, data: Partial<ExerciseMedia>): Promise<ExerciseMedia> {
  const res = await api.post<ApiResponse<ExerciseMedia>>(`/admin/exercises/${exerciseId}/media`, data);
  return res.data.data;
}

export async function deleteMedia(exerciseId: string, mediaId: string): Promise<void> {
  await api.delete(`/admin/exercises/${exerciseId}/media/${mediaId}`);
}

// ── Translations ──────────────────────────────────────────────────────────────

export async function listTranslations(exerciseId: string): Promise<ExerciseTranslation[]> {
  const res = await api.get<ApiResponse<ExerciseTranslation[]>>(`/admin/exercises/${exerciseId}/translations`);
  return res.data.data;
}

export async function saveTranslation(
  exerciseId: string,
  locale: string,
  data: Partial<ExerciseTranslation>
): Promise<ExerciseTranslation> {
  const res = await api.put<ApiResponse<ExerciseTranslation>>(
    `/admin/exercises/${exerciseId}/translations/${locale}`,
    data
  );
  return res.data.data;
}

// ── Import ────────────────────────────────────────────────────────────────────

export async function listImportProviders(): Promise<string[]> {
  const res = await api.get<ApiResponse<string[]>>("/admin/exercises/import/providers");
  return res.data.data;
}

export async function triggerImport(data: {
  provider: string;
  dryRun?: boolean;
  overwriteExisting?: boolean;
}): Promise<ImportHistory> {
  const res = await api.post<ApiResponse<ImportHistory>>("/admin/exercises/import", data);
  return res.data.data;
}

export async function listImportHistory(page = 0, size = 20): Promise<PagedResponse<ImportHistory>> {
  const res = await api.get<ApiResponse<PagedResponse<ImportHistory>>>("/admin/exercises/import/history", {
    params: { page, size },
  });
  return res.data.data;
}

export async function getImportRecord(importId: string): Promise<ImportHistory> {
  const res = await api.get<ApiResponse<ImportHistory>>(`/admin/exercises/import/${importId}`);
  return res.data.data;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export async function listAuditLog(page = 0, size = 50): Promise<PagedResponse<AuditLog>> {
  const res = await api.get<ApiResponse<PagedResponse<AuditLog>>>("/admin/audit-log", {
    params: { page, size },
  });
  return res.data.data;
}

export async function getExerciseAuditLog(id: string, page = 0): Promise<PagedResponse<AuditLog>> {
  const res = await api.get<ApiResponse<PagedResponse<AuditLog>>>(`/admin/exercises/${id}/audit-log`, {
    params: { page },
  });
  return res.data.data;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<ApiResponse<DashboardStats>>("/admin/dashboard/stats");
  return res.data.data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await api.post<ApiResponse<{
    userId: string; email: string; firstName: string; lastName: string;
    role: string; accessToken: string; refreshToken: string; accessTokenExpiresIn: number;
  }>>("/auth/login", { email, password });
  return res.data.data;
}
