import { MuscleGroup, EquipmentType, ExerciseDifficulty } from '@/types';

type TFunc = (key: string) => string;

// Shared with WorkoutPlansScreen's "By Muscle Group" grid, which already
// translates these same 14 values under the workoutPlans.muscle* keys.
const MUSCLE_KEYS: Record<MuscleGroup, string> = {
  CHEST: 'workoutPlans.muscleChest',
  BACK: 'workoutPlans.muscleBack',
  SHOULDERS: 'workoutPlans.muscleShoulders',
  BICEPS: 'workoutPlans.muscleBiceps',
  TRICEPS: 'workoutPlans.muscleTriceps',
  FOREARMS: 'workoutPlans.muscleForearms',
  CORE: 'workoutPlans.muscleCore',
  GLUTES: 'workoutPlans.muscleGlutes',
  QUADRICEPS: 'workoutPlans.muscleQuads',
  HAMSTRINGS: 'workoutPlans.muscleHamstrings',
  CALVES: 'workoutPlans.muscleCalves',
  FULL_BODY: 'workoutPlans.muscleFullBody',
  CARDIO: 'workoutPlans.muscleCardio',
  OTHER: 'workoutPlans.muscleOther',
};

const EQUIPMENT_KEYS: Record<EquipmentType, string> = {
  BARBELL: 'equipment.barbell',
  DUMBBELL: 'equipment.dumbbell',
  MACHINE: 'equipment.machine',
  CABLE: 'equipment.cable',
  BODYWEIGHT: 'equipment.bodyweight',
  KETTLEBELL: 'equipment.kettlebell',
  RESISTANCE_BAND: 'equipment.resistanceBand',
  SMITH_MACHINE: 'equipment.smithMachine',
  OTHER: 'equipment.other',
};

export function muscleGroupLabel(mg: MuscleGroup, t: TFunc): string {
  const key = MUSCLE_KEYS[mg];
  return key ? t(key) : mg.replace(/_/g, ' ');
}

export function equipmentLabel(eq: EquipmentType, t: TFunc): string {
  const key = EQUIPMENT_KEYS[eq];
  return key ? t(key) : eq.replace(/_/g, ' ');
}

// Shared with WorkoutPlansScreen's template difficulty badges, which already
// translate these same 3 values under the workoutPlans.diff* keys.
const DIFFICULTY_KEYS: Record<ExerciseDifficulty, string> = {
  BEGINNER: 'workoutPlans.diffBeginner',
  INTERMEDIATE: 'workoutPlans.diffIntermediate',
  ADVANCED: 'workoutPlans.diffAdvanced',
};

export function difficultyLabel(d: ExerciseDifficulty, t: TFunc): string {
  const key = DIFFICULTY_KEYS[d];
  return key ? t(key) : d;
}
