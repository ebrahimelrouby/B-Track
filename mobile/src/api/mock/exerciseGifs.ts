// Animated exercise GIF demos.
// Source: ExerciseDB open dataset — hosted on GitHub raw CDN (MIT-compatible).
// These are 3D muscle-highlight animated GIFs, one per exercise.

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

export const EXERCISE_GIF_MAP: Record<string, string> = {
  // ── Chest ────────────────────────────────────────────────────────────────────
  'ex-1':  `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.gif`,
  'ex-2':  `${BASE}/Incline_Dumbbell_Press/0.gif`,
  'ex-3':  `${BASE}/Clock_Push-Up/0.gif`,
  'ex-4':  `${BASE}/Flat_Bench_Cable_Flyes/0.gif`,
  'ex-5':  `${BASE}/Bench_Dips/0.gif`,
  'ex-27': `${BASE}/Decline_Barbell_Bench_Press/0.gif`,
  'ex-28': `${BASE}/Decline_Dumbbell_Flyes/0.gif`,

  // ── Back ─────────────────────────────────────────────────────────────────────
  'ex-6':  `${BASE}/Band_Assisted_Pull-Up/0.gif`,
  'ex-7':  `${BASE}/Barbell_Deadlift/0.gif`,
  'ex-8':  `${BASE}/Reverse_Grip_Bent-Over_Rows/0.gif`,
  'ex-9':  `${BASE}/Close-Grip_Front_Lat_Pulldown/0.gif`,
  'ex-10': `${BASE}/Seated_Cable_Rows/0.gif`,
  'ex-29': `${BASE}/Lying_T-Bar_Row/0.gif`,
  'ex-30': `${BASE}/Chin-Up/0.gif`,
  'ex-31': `${BASE}/Bent_Over_Two-Dumbbell_Row/0.gif`,

  // ── Shoulders ────────────────────────────────────────────────────────────────
  'ex-11': `${BASE}/Barbell_Shoulder_Press/0.gif`,
  'ex-12': `${BASE}/Cable_Seated_Lateral_Raise/0.gif`,
  'ex-13': `${BASE}/Face_Pull/0.gif`,
  'ex-32': `${BASE}/Kettlebell_Arnold_Press/0.gif`,
  'ex-33': `${BASE}/Front_Raise_And_Pullover/0.gif`,
  'ex-34': `${BASE}/Barbell_Rear_Delt_Row/0.gif`,

  // ── Legs ─────────────────────────────────────────────────────────────────────
  'ex-14': `${BASE}/Barbell_Full_Squat/0.gif`,
  'ex-15': `${BASE}/Romanian_Deadlift/0.gif`,
  'ex-16': `${BASE}/Leg_Press/0.gif`,
  'ex-17': `${BASE}/Dumbbell_Lunges/0.gif`,
  'ex-18': `${BASE}/Ball_Leg_Curl/0.gif`,
  'ex-19': `${BASE}/Barbell_Seated_Calf_Raise/0.gif`,
  'ex-35': `${BASE}/Hack_Squat/0.gif`,
  'ex-36': `${BASE}/Leg_Extensions/0.gif`,
  'ex-37': `${BASE}/Barbell_Full_Squat/0.gif`,
  'ex-38': `${BASE}/Barbell_Hip_Thrust/0.gif`,

  // ── Biceps ───────────────────────────────────────────────────────────────────
  'ex-20': `${BASE}/Barbell_Curl/0.gif`,
  'ex-21': `${BASE}/Alternate_Hammer_Curl/0.gif`,
  'ex-39': `${BASE}/Incline_Dumbbell_Curl/0.gif`,
  'ex-40': `${BASE}/Cable_Hammer_Curls_-_Rope_Attachment/0.gif`,

  // ── Triceps ──────────────────────────────────────────────────────────────────
  'ex-22': `${BASE}/Reverse_Grip_Triceps_Pushdown/0.gif`,
  'ex-23': `${BASE}/Band_Skull_Crusher/0.gif`,
  'ex-41': `${BASE}/Cable_Rope_Overhead_Triceps_Extension/0.gif`,
  'ex-42': `${BASE}/Close-Grip_Barbell_Bench_Press/0.gif`,

  // ── Core ─────────────────────────────────────────────────────────────────────
  'ex-24': `${BASE}/Plank/0.gif`,
  'ex-25': `${BASE}/Crunches/0.gif`,
  'ex-26': `${BASE}/Russian_Twist/0.gif`,
  'ex-43': `${BASE}/Hanging_Leg_Raise/0.gif`,
  'ex-44': `${BASE}/Cable_Crunch/0.gif`,

  // ── Cardio ───────────────────────────────────────────────────────────────────
  'ex-45': `${BASE}/Jogging_Treadmill/0.gif`,
  'ex-46': `${BASE}/Rope_Jumping/0.gif`,
  'ex-47': `${BASE}/Box_Jump_Multiple_Response/0.gif`,
};
