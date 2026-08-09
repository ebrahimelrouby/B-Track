import { WorkoutPlan, WorkoutDay, WorkoutDayExercise, WorkoutSession, WorkoutSet, ActiveWorkout, PagedResponse } from '@/types';
import { localDb, newId } from './localDb';
import { EXERCISE_SEED, WORKOUT_TEMPLATES } from './exerciseSeed';

const PLANS_KEY = (uid: string) => `mock:plans:${uid}`;
const SESSIONS_KEY = (uid: string) => `mock:sessions:${uid}`;

// ─── Plans ─────────────────────────────────────────────────────────────────────

export const mockWorkoutApi = {
  getPlans: async (userId: string): Promise<WorkoutPlan[]> => {
    return localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
  },

  getPlan: async (userId: string, planId: string): Promise<WorkoutPlan> => {
    const plans = localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
    const plan = plans.find((p) => p.id === planId);
    if (!plan) throw { response: { data: { message: 'Plan not found', errorCode: 'WRK_001' } } };
    return plan;
  },

  createPlan: async (userId: string, data: { name: string; description?: string }): Promise<WorkoutPlan> => {
    const plans = localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
    if (plans.length >= 3) {
      throw { response: { data: { message: 'Free plan limit reached for workout plans.', errorCode: 'SUB_002' } } };
    }
    const plan: WorkoutPlan = {
      id: newId(),
      name: data.name,
      description: data.description,
      days: [],
      createdAt: new Date().toISOString(),
    };
    localDb.append(PLANS_KEY(userId), plan);
    return plan;
  },

  deletePlan: async (userId: string, planId: string): Promise<void> => {
    localDb.remove<WorkoutPlan>(PLANS_KEY(userId), planId);
  },

  addDay: async (userId: string, planId: string, data: { name: string; notes?: string }): Promise<WorkoutDay> => {
    const plans = localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
    const planIdx = plans.findIndex((p) => p.id === planId);
    if (planIdx === -1) throw { response: { data: { message: 'Plan not found' } } };

    const day: WorkoutDay = {
      id: newId(),
      planId,
      name: data.name,
      sortOrder: plans[planIdx].days.length,
      exercises: [],
    };
    plans[planIdx].days.push(day);
    localDb.set(PLANS_KEY(userId), plans);
    return day;
  },

  renameDay: async (userId: string, dayId: string, name: string): Promise<WorkoutDay> => {
    const plans = localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
    for (const plan of plans) {
      const dayIdx = plan.days.findIndex((d) => d.id === dayId);
      if (dayIdx !== -1) {
        plan.days[dayIdx].name = name;
        localDb.set(PLANS_KEY(userId), plans);
        return plan.days[dayIdx];
      }
    }
    throw { response: { data: { message: 'Day not found' } } };
  },

  deleteDay: async (userId: string, dayId: string): Promise<void> => {
    const plans = localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
    for (const plan of plans) {
      const dayIdx = plan.days.findIndex((d) => d.id === dayId);
      if (dayIdx !== -1) {
        plan.days.splice(dayIdx, 1);
        plan.days.forEach((d, i) => { d.sortOrder = i; });
        localDb.set(PLANS_KEY(userId), plans);
        return;
      }
    }
    throw { response: { data: { message: 'Day not found' } } };
  },

  addExercise: async (
    userId: string,
    dayId: string,
    data: {
      exerciseId: string;
      targetSets?: number;
      targetRepsMin?: number;
      targetRepsMax?: number;
      targetWeightKg?: number;
      restSeconds?: number;
      notes?: string;
    }
  ): Promise<WorkoutDayExercise> => {
    const exercise = EXERCISE_SEED.find((e) => e.id === data.exerciseId);
    if (!exercise) throw { response: { data: { message: 'Exercise not found' } } };

    const plans = localDb.getList<WorkoutPlan>(PLANS_KEY(userId));
    let added: WorkoutDayExercise | null = null;

    for (const plan of plans) {
      const dayIdx = plan.days.findIndex((d) => d.id === dayId);
      if (dayIdx === -1) continue;

      const wde: WorkoutDayExercise = {
        id: newId(),
        exercise,
        sortOrder: plan.days[dayIdx].exercises.length,
        targetSets: data.targetSets,
        targetRepsMin: data.targetRepsMin,
        targetRepsMax: data.targetRepsMax,
        targetWeightKg: data.targetWeightKg,
        restSeconds: data.restSeconds ?? 90,
        notes: data.notes,
      };
      plan.days[dayIdx].exercises.push(wde);
      added = wde;
    }

    localDb.set(PLANS_KEY(userId), plans);
    if (!added) throw { response: { data: { message: 'Day not found' } } };
    return added;
  },

  // ─── Sessions ──────────────────────────────────────────────────────────────

  startSession: async (_userId: string, _data: any): Promise<WorkoutSession> => {
    // Session is managed entirely in the activeWorkout Zustand store locally.
    // Return a placeholder so the screen doesn't crash if it reads the response.
    return { id: newId(), name: _data.name ?? 'Workout', status: 'IN_PROGRESS', startedAt: new Date().toISOString(), exercises: [] };
  },

  finishSession: async (_userId: string, _sessionId: string, _notes?: string): Promise<WorkoutSession> => {
    return { id: _sessionId, name: 'Workout', status: 'COMPLETED', startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), exercises: [] };
  },

  syncSession: async (userId: string, session: ActiveWorkout): Promise<WorkoutSession> => {
    const completedAt = new Date().toISOString();
    const durationSeconds = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);

    const stored: WorkoutSession = {
      id: newId(),
      name: session.name,
      status: 'COMPLETED',
      startedAt: session.startedAt,
      completedAt,
      durationSeconds,
      totalVolumeKg: session.exercises.reduce((total, ex) =>
        total + ex.sets.reduce((s, set) =>
          s + (set.isCompleted && set.weightKg && set.reps ? set.weightKg * set.reps : 0), 0
        ), 0
      ),
      exercises: session.exercises.map((ex) => ({
        id: newId(),
        exercise: ex.exercise,
        sets: ex.sets.map((s) => ({
          id: newId(),
          setNumber: s.setNumber,
          setType: s.setType,
          weightKg: s.weightKg,
          reps: s.reps,
          rpe: s.rpe,
          restSeconds: s.restSeconds,
          notes: s.notes,
          isCompleted: s.isCompleted,
          completedAt: s.completedAt,
        })),
      })),
    };

    const sessions = localDb.getList<WorkoutSession>(SESSIONS_KEY(userId));
    sessions.unshift(stored); // newest first
    localDb.set(SESSIONS_KEY(userId), sessions);
    return stored;
  },

  importTemplate: async (userId: string, templateId: string): Promise<WorkoutPlan> => {
    const tpl = WORKOUT_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) throw { response: { data: { message: 'Template not found' } } };

    const plan: WorkoutPlan = {
      id: newId(),
      name: tpl.name,
      description: tpl.description,
      days: tpl.days.map((d) => {
        const dayId = newId();
        return {
          id: dayId,
          planId: '',
          name: d.name,
          sortOrder: 0,
          exercises: d.exercises.map((e, i) => {
            const exercise = EXERCISE_SEED.find((ex) => ex.id === e.exerciseId);
            if (!exercise) return null;
            return {
              id: newId(),
              exercise,
              sortOrder: i,
              targetSets: e.targetSets,
              targetRepsMin: e.targetRepsMin,
              targetRepsMax: e.targetRepsMax,
              restSeconds: e.restSeconds,
            } as WorkoutDayExercise;
          }).filter(Boolean) as WorkoutDayExercise[],
        };
      }),
      createdAt: new Date().toISOString(),
    };

    plan.days.forEach((d) => { d.planId = plan.id; });
    localDb.append(PLANS_KEY(userId), plan);
    return plan;
  },

  getLastSetsForExercise: async (userId: string, exerciseId: string): Promise<WorkoutSet[]> => {
    const sessions = localDb.getList<WorkoutSession>(SESSIONS_KEY(userId));
    for (const session of sessions) {
      const match = session.exercises?.find((ex) => ex.exercise.id === exerciseId);
      if (match) return match.sets;
    }
    return [];
  },

  getHistory: async (userId: string, page = 0, size = 20): Promise<PagedResponse<WorkoutSession>> => {
    const all = localDb.getList<WorkoutSession>(SESSIONS_KEY(userId));
    const start = page * size;
    const content = all.slice(start, start + size);
    return {
      content,
      page,
      size,
      totalElements: all.length,
      totalPages: Math.ceil(all.length / size),
      first: page === 0,
      last: start + size >= all.length,
    };
  },
};
