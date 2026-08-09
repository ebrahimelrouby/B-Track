import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { ActiveWorkout, ActiveExercise, ActiveSet, Exercise, SetType } from '@/types';
import { newId } from '@/api/mock/localDb';

const storage = new MMKV({ id: 'workout-storage' });
const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};

interface ActiveWorkoutState {
  activeWorkout: ActiveWorkout | null;
  isWorkoutActive: boolean;
  // Best-effort "what the user is doing right now" signal, used to tell the
  // Apple Watch / Wear OS companion apps which exercise to show — there's no
  // single "current exercise" concept in the phone UI (it's a flat scrollable
  // list), so this just tracks whichever exercise was most recently touched.
  currentExerciseLocalId: string | null;

  startWorkout: (params: { planId?: string; dayId?: string; name: string }) => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (localId: string) => void;
  duplicateExercise: (localId: string) => void;
  addSet: (exerciseLocalId: string, previousSet?: ActiveSet) => ActiveSet | undefined;
  updateSet: (exerciseLocalId: string, setLocalId: string, updates: Partial<ActiveSet>) => void;
  completeSet: (exerciseLocalId: string, setLocalId: string) => void;
  removeSet: (exerciseLocalId: string, setLocalId: string) => void;
  cycleSetType: (exerciseLocalId: string, setLocalId: string) => void;
  updateNotes: (notes: string) => void;
  updateExerciseNotes: (exerciseLocalId: string, notes: string) => void;
  finishWorkout: () => ActiveWorkout | null;
  discardWorkout: () => void;
  setCurrentExercise: (localId: string) => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      isWorkoutActive: false,
      currentExerciseLocalId: null,

      startWorkout: ({ planId, dayId, name }) => {
        set({
          activeWorkout: {
            localSessionId: newId(),
            planId,
            dayId,
            name,
            startedAt: new Date().toISOString(),
            isPaused: false,
            exercises: [],
          },
          isWorkoutActive: true,
          currentExerciseLocalId: null,
        });
      },

      setCurrentExercise: (localId) => set({ currentExerciseLocalId: localId }),

      pauseWorkout: () => {
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, isPaused: true, pausedAt: new Date().toISOString() }
            : null,
        }));
      },

      resumeWorkout: () => {
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? { ...state.activeWorkout, isPaused: false, pausedAt: undefined }
            : null,
        }));
      },

      addExercise: (exercise) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          const newExercise: ActiveExercise = {
            localId: newId(),
            exercise,
            sortOrder: state.activeWorkout.exercises.length,
            sets: [],
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, newExercise],
            },
            currentExerciseLocalId: state.currentExerciseLocalId ?? newExercise.localId,
          };
        });
      },

      removeExercise: (localId) => {
        set((state) => ({
          activeWorkout: state.activeWorkout
            ? {
                ...state.activeWorkout,
                exercises: state.activeWorkout.exercises.filter((e) => e.localId !== localId),
              }
            : null,
        }));
      },

      duplicateExercise: (localId) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          const src = state.activeWorkout.exercises.find((e) => e.localId === localId);
          if (!src) return state;
          const copy: ActiveExercise = {
            localId: newId(),
            exercise: src.exercise,
            sortOrder: state.activeWorkout.exercises.length,
            sets: src.sets.map((s) => ({
              ...s,
              localId: newId(),
              isCompleted: false,
              completedAt: undefined,
            })),
            notes: src.notes,
            restTimerSeconds: src.restTimerSeconds,
          };
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: [...state.activeWorkout.exercises, copy],
            },
          };
        });
      },

      addSet: (exerciseLocalId, previousSet) => {
        let created: ActiveSet | undefined;
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) => {
                if (ex.localId !== exerciseLocalId) return ex;
                const nextNum = ex.sets.length + 1;
                const newSet: ActiveSet = {
                  localId: newId(),
                  setNumber: nextNum,
                  setType: 'NORMAL',
                  weightKg: previousSet?.weightKg,
                  reps: previousSet?.reps,
                  isCompleted: false,
                };
                created = newSet;
                return { ...ex, sets: [...ex.sets, newSet] };
              }),
            },
          };
        });
        return created;
      },

      updateSet: (exerciseLocalId, setLocalId, updates) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) => {
                if (ex.localId !== exerciseLocalId) return ex;
                return {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.localId === setLocalId ? { ...s, ...updates } : s
                  ),
                };
              }),
            },
          };
        });
      },

      completeSet: (exerciseLocalId, setLocalId) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) => {
                if (ex.localId !== exerciseLocalId) return ex;
                return {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.localId === setLocalId
                      ? { ...s, isCompleted: !s.isCompleted, completedAt: new Date().toISOString() }
                      : s
                  ),
                };
              }),
            },
            currentExerciseLocalId: exerciseLocalId,
          };
        });
      },

      removeSet: (exerciseLocalId, setLocalId) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) => {
                if (ex.localId !== exerciseLocalId) return ex;
                return {
                  ...ex,
                  sets: ex.sets
                    .filter((s) => s.localId !== setLocalId)
                    .map((s, i) => ({ ...s, setNumber: i + 1 })),
                };
              }),
            },
          };
        });
      },

      cycleSetType: (exerciseLocalId, setLocalId) => {
        const ORDER: SetType[] = ['NORMAL', 'WARMUP', 'DROP_SET', 'FAILURE', 'AMRAP', 'TEMPO'];
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) => {
                if (ex.localId !== exerciseLocalId) return ex;
                return {
                  ...ex,
                  sets: ex.sets.map((s) => {
                    if (s.localId !== setLocalId) return s;
                    const idx = ORDER.indexOf(s.setType);
                    return { ...s, setType: ORDER[(idx + 1) % ORDER.length] };
                  }),
                };
              }),
            },
          };
        });
      },

      updateExerciseNotes: (exerciseLocalId, notes) => {
        set((state) => {
          if (!state.activeWorkout) return state;
          return {
            activeWorkout: {
              ...state.activeWorkout,
              exercises: state.activeWorkout.exercises.map((ex) =>
                ex.localId === exerciseLocalId ? { ...ex, notes } : ex
              ),
            },
          };
        });
      },

      updateNotes: (notes) => {
        set((state) => ({
          activeWorkout: state.activeWorkout ? { ...state.activeWorkout, notes } : null,
        }));
      },

      finishWorkout: () => {
        const workout = get().activeWorkout;
        set({ activeWorkout: null, isWorkoutActive: false, currentExerciseLocalId: null });
        return workout;
      },

      discardWorkout: () => {
        set({ activeWorkout: null, isWorkoutActive: false, currentExerciseLocalId: null });
      },
    }),
    {
      name: 'active-workout',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
