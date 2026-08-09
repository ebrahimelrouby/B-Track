import { USE_MOCK_API } from '@/constants/config';
import { WorkoutPlan, WorkoutDay, WorkoutDayExercise, WorkoutSession, WorkoutSet, ApiResponse, PagedResponse, ActiveWorkout } from '@/types';
import { mockWorkoutApi } from './mock/workout.mock';
import { useAuthStore } from '@/store/auth.store';
import apiClient from './client';

function uid(): string {
  return useAuthStore.getState().user?.userId ?? '';
}

export const workoutApi = {
  // Plans
  getPlans: (): Promise<WorkoutPlan[]> =>
    USE_MOCK_API
      ? mockWorkoutApi.getPlans(uid())
      : apiClient.get<ApiResponse<WorkoutPlan[]>>('/workout-plans').then((r) => r.data.data!),

  getPlan: (planId: string): Promise<WorkoutPlan> =>
    USE_MOCK_API
      ? mockWorkoutApi.getPlan(uid(), planId)
      : apiClient.get<ApiResponse<WorkoutPlan>>(`/workout-plans/${planId}`).then((r) => r.data.data!),

  createPlan: (data: { name: string; description?: string }): Promise<WorkoutPlan> =>
    USE_MOCK_API
      ? mockWorkoutApi.createPlan(uid(), data)
      : apiClient.post<ApiResponse<WorkoutPlan>>('/workout-plans', data).then((r) => r.data.data!),

  deletePlan: (planId: string): Promise<void> =>
    USE_MOCK_API
      ? mockWorkoutApi.deletePlan(uid(), planId)
      : apiClient.delete(`/workout-plans/${planId}`).then(() => {}),

  // Days
  addDay: (planId: string, data: { name: string; notes?: string }): Promise<WorkoutDay> =>
    USE_MOCK_API
      ? mockWorkoutApi.addDay(uid(), planId, data)
      : apiClient.post<ApiResponse<WorkoutDay>>(`/workout-plans/${planId}/days`, data).then((r) => r.data.data!),

  renameDay: (dayId: string, name: string): Promise<WorkoutDay> =>
    USE_MOCK_API
      ? mockWorkoutApi.renameDay(uid(), dayId, name)
      : apiClient.patch<ApiResponse<WorkoutDay>>(`/workout-plans/days/${dayId}`, { name }).then((r) => r.data.data!),

  deleteDay: (dayId: string): Promise<void> =>
    USE_MOCK_API
      ? mockWorkoutApi.deleteDay(uid(), dayId)
      : apiClient.delete(`/workout-plans/days/${dayId}`).then(() => {}),

  // Exercises
  addExercise: (dayId: string, data: {
    exerciseId: string;
    targetSets?: number;
    targetRepsMin?: number;
    targetRepsMax?: number;
    targetWeightKg?: number;
    restSeconds?: number;
    notes?: string;
  }): Promise<WorkoutDayExercise> =>
    USE_MOCK_API
      ? mockWorkoutApi.addExercise(uid(), dayId, data)
      : apiClient.post<ApiResponse<WorkoutDayExercise>>(`/workout-plans/days/${dayId}/exercises`, data).then((r) => r.data.data!),

  // Sessions
  startSession: (data: { planId?: string; dayId?: string; name?: string; localSessionId?: string }): Promise<WorkoutSession> =>
    USE_MOCK_API
      ? mockWorkoutApi.startSession(uid(), data)
      : apiClient.post<ApiResponse<WorkoutSession>>('/sessions/start', data).then((r) => r.data.data!),

  finishSession: (sessionId: string, notes?: string): Promise<WorkoutSession> =>
    USE_MOCK_API
      ? mockWorkoutApi.finishSession(uid(), sessionId, notes)
      : apiClient.post<ApiResponse<WorkoutSession>>(`/sessions/${sessionId}/finish`, { notes }).then((r) => r.data.data!),

  syncSession: (session: ActiveWorkout): Promise<WorkoutSession> =>
    USE_MOCK_API
      ? mockWorkoutApi.syncSession(uid(), session)
      : apiClient.post<ApiResponse<WorkoutSession>>('/sessions/sync', {
          localSessionId: session.localSessionId,
          planId: session.planId,
          dayId: session.dayId,
          name: session.name,
          startedAt: session.startedAt,
          completedAt: new Date().toISOString(),
          durationSeconds: Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
          notes: session.notes,
          exercises: session.exercises.map((ex, i) => ({
            exerciseId: ex.exercise.id,
            sortOrder: i,
            notes: ex.notes,
            sets: ex.sets.map((s) => ({
              setNumber: s.setNumber,
              setType: s.setType,
              weightKg: s.weightKg,
              reps: s.reps,
              rpe: s.rpe,
              restSeconds: s.restSeconds,
              notes: s.notes,
              completed: s.isCompleted,
              completedAt: s.completedAt,
            })),
          })),
        }).then((r) => r.data.data!),

  getHistory: (page = 0, size = 20): Promise<PagedResponse<WorkoutSession>> =>
    USE_MOCK_API
      ? mockWorkoutApi.getHistory(uid(), page, size)
      : apiClient.get<ApiResponse<PagedResponse<WorkoutSession>>>('/sessions/history', { params: { page, size } }).then((r) => r.data.data!),

  getLastSetsForExercise: (exerciseId: string): Promise<WorkoutSet[]> =>
    USE_MOCK_API
      ? mockWorkoutApi.getLastSetsForExercise(uid(), exerciseId)
      : apiClient.get<ApiResponse<WorkoutSet[]>>(`/sessions/exercises/${exerciseId}/last-sets`).then((r) => r.data.data ?? []),

  importTemplate: (templateId: string): Promise<WorkoutPlan> =>
    USE_MOCK_API
      ? mockWorkoutApi.importTemplate(uid(), templateId)
      : apiClient.post<ApiResponse<WorkoutPlan>>(`/workout-plans/templates/${templateId}/import`).then((r) => r.data.data!),
};
