import { MuscleGroup } from '@/types';

// Base fallback — one icon per muscle group, used only when no more specific
// keyword match (below) fires. Every group has its own distinct glyph.
const MUSCLE_ICONS: Record<MuscleGroup, string> = {
  CHEST: 'weight-lifter', BACK: 'rowing', SHOULDERS: 'human-handsup',
  BICEPS: 'arm-flex', TRICEPS: 'arm-flex-outline', FOREARMS: 'weight',
  CORE: 'yoga', GLUTES: 'kettlebell', QUADRICEPS: 'run',
  HAMSTRINGS: 'walk', CALVES: 'run-fast', FULL_BODY: 'human',
  CARDIO: 'heart-pulse', OTHER: 'dumbbell',
};

// Movement-pattern keyword overrides, checked in order against the exercise
// name — gives real per-exercise visual variety across a 900+ exercise
// library instead of ~10 icons shared by muscle group alone. Falls through
// to MUSCLE_ICONS when nothing matches.
const PATTERN_ICONS: [RegExp, string][] = [
  [/deadlift/i, 'weight'],
  [/squat/i, 'human-handsdown'],
  [/lunge/i, 'walk'],
  [/\bcurl\b/i, 'arm-flex'],
  [/\brow\b|rowing/i, 'rowing'],
  [/pull[\s-]?up|chin[\s-]?up|pulldown/i, 'human-handsup'],
  [/\bdip\b/i, 'arrow-down-bold-box-outline'],
  [/press|push[\s-]?up|bench/i, 'arrow-up-bold-box-outline'],
  [/raise/i, 'chevron-double-up'],
  [/swing/i, 'kettlebell'],
  [/jump rope|jumping rope/i, 'jump-rope'],
  [/treadmill|running|\brun\b|\bjog/i, 'run-fast'],
  [/\bbike\b|cycling|cycle/i, 'bike'],
  [/\bswim/i, 'swim'],
  [/punch|boxing/i, 'boxing-glove'],
  [/\bkick/i, 'karate'],
];

export function exerciseIcon(name: string, muscleGroup: MuscleGroup): string {
  const match = PATTERN_ICONS.find(([re]) => re.test(name));
  return match ? match[1] : MUSCLE_ICONS[muscleGroup];
}

export { MUSCLE_ICONS };
