import { Exercise } from '@/types';

export const EXERCISE_SEED: Exercise[] = [
  // ── Chest ───────────────────────────────────────────────────────────────────
  { id: 'ex-1',  name: 'Barbell Bench Press',     muscleGroup: 'CHEST',      equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Lie flat on bench. Grip bar slightly wider than shoulder width. Lower bar to chest. Press up explosively.', isCustom: false },
  { id: 'ex-2',  name: 'Incline Dumbbell Press',  muscleGroup: 'CHEST',      equipment: 'DUMBBELL',   difficulty: 'INTERMEDIATE', instructions: 'Set bench to 30-45 degrees. Press dumbbells up from chest level.', isCustom: false },
  { id: 'ex-3',  name: 'Push-Up',                 muscleGroup: 'CHEST',      equipment: 'BODYWEIGHT', difficulty: 'BEGINNER',     instructions: 'Start in plank position. Lower chest to floor. Push back up keeping core tight.', isCustom: false },
  { id: 'ex-4',  name: 'Cable Flye',              muscleGroup: 'CHEST',      equipment: 'CABLE',      difficulty: 'INTERMEDIATE', instructions: 'Stand between cable towers. With slight elbow bend, bring hands together in arc.', isCustom: false },
  { id: 'ex-5',  name: 'Dips',                    muscleGroup: 'CHEST',      equipment: 'BODYWEIGHT', difficulty: 'INTERMEDIATE', instructions: 'Support body on parallel bars. Lower until upper arms are parallel. Press back up.', isCustom: false },
  { id: 'ex-27', name: 'Decline Bench Press',     muscleGroup: 'CHEST',      equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Set bench to -15 degrees. Lower bar to lower chest. Press explosively.', isCustom: false },
  { id: 'ex-28', name: 'Dumbbell Flye',           muscleGroup: 'CHEST',      equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Lie on bench. With slight elbow bend, lower dumbbells to sides. Bring together over chest.', isCustom: false },
  // ── Back ────────────────────────────────────────────────────────────────────
  { id: 'ex-6',  name: 'Pull-Up',                 muscleGroup: 'BACK',       equipment: 'BODYWEIGHT', difficulty: 'INTERMEDIATE', instructions: 'Hang from bar with overhand grip. Pull chest to bar. Lower with control.', isCustom: false },
  { id: 'ex-7',  name: 'Barbell Deadlift',        muscleGroup: 'BACK',       equipment: 'BARBELL',    difficulty: 'ADVANCED',     instructions: 'Stand with feet hip-width. Hinge at hips. Grip bar. Drive through heels to stand.', isCustom: false },
  { id: 'ex-8',  name: 'Bent-Over Barbell Row',   muscleGroup: 'BACK',       equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Hinge forward at hips. Pull bar to lower chest. Squeeze shoulder blades.', isCustom: false },
  { id: 'ex-9',  name: 'Lat Pulldown',            muscleGroup: 'BACK',       equipment: 'CABLE',      difficulty: 'BEGINNER',     instructions: 'Grip bar wider than shoulders. Pull to upper chest. Control the return.', isCustom: false },
  { id: 'ex-10', name: 'Seated Cable Row',        muscleGroup: 'BACK',       equipment: 'CABLE',      difficulty: 'BEGINNER',     instructions: 'Sit upright. Pull handle to abdomen. Squeeze back muscles.', isCustom: false },
  { id: 'ex-29', name: 'T-Bar Row',               muscleGroup: 'BACK',       equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Straddle T-bar. Hinge forward. Pull to chest. Squeeze lats at top.', isCustom: false },
  { id: 'ex-30', name: 'Chin-Up',                 muscleGroup: 'BACK',       equipment: 'BODYWEIGHT', difficulty: 'INTERMEDIATE', instructions: 'Hang from bar with underhand grip. Pull chin above bar. Lower with control.', isCustom: false },
  { id: 'ex-31', name: 'Dumbbell Row',            muscleGroup: 'BACK',       equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Place knee and hand on bench. Pull dumbbell to hip. Lower with control.', isCustom: false },
  // ── Shoulders ───────────────────────────────────────────────────────────────
  { id: 'ex-11', name: 'Overhead Press',          muscleGroup: 'SHOULDERS',  equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Stand with feet shoulder-width. Press bar from shoulder to overhead. Lock out arms.', isCustom: false },
  { id: 'ex-12', name: 'Dumbbell Lateral Raise',  muscleGroup: 'SHOULDERS',  equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Stand tall. Raise dumbbells to sides to shoulder height. Control descent.', isCustom: false },
  { id: 'ex-13', name: 'Face Pull',               muscleGroup: 'SHOULDERS',  equipment: 'CABLE',      difficulty: 'BEGINNER',     instructions: 'Pull rope attachment to face level. Rotate shoulders externally.', isCustom: false },
  { id: 'ex-32', name: 'Arnold Press',            muscleGroup: 'SHOULDERS',  equipment: 'DUMBBELL',   difficulty: 'INTERMEDIATE', instructions: 'Start with palms facing you at shoulder height. Rotate palms outward as you press overhead.', isCustom: false },
  { id: 'ex-33', name: 'Front Raise',             muscleGroup: 'SHOULDERS',  equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Stand tall. Raise dumbbells straight ahead to shoulder height. Control the descent.', isCustom: false },
  { id: 'ex-34', name: 'Rear Delt Flye',          muscleGroup: 'SHOULDERS',  equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Hinge forward. With slight elbow bend, raise dumbbells to side. Squeeze rear delts.', isCustom: false },
  // ── Legs ────────────────────────────────────────────────────────────────────
  { id: 'ex-14', name: 'Back Squat',              muscleGroup: 'QUADRICEPS', equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Bar on upper back. Feet shoulder-width. Squat until thighs parallel. Drive up.', isCustom: false },
  { id: 'ex-15', name: 'Romanian Deadlift',       muscleGroup: 'HAMSTRINGS', equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Stand with bar. Hinge at hips with slight knee bend. Feel hamstring stretch. Return to start.', isCustom: false },
  { id: 'ex-16', name: 'Leg Press',               muscleGroup: 'QUADRICEPS', equipment: 'MACHINE',    difficulty: 'BEGINNER',     instructions: 'Seat in machine. Place feet on platform. Press until legs nearly straight.', isCustom: false },
  { id: 'ex-17', name: 'Lunges',                  muscleGroup: 'QUADRICEPS', equipment: 'BODYWEIGHT', difficulty: 'BEGINNER',     instructions: 'Step forward. Lower back knee toward floor. Push back to start.', isCustom: false },
  { id: 'ex-18', name: 'Leg Curl',                muscleGroup: 'HAMSTRINGS', equipment: 'MACHINE',    difficulty: 'BEGINNER',     instructions: 'Lie prone. Curl legs toward glutes. Control descent.', isCustom: false },
  { id: 'ex-19', name: 'Calf Raise',              muscleGroup: 'CALVES',     equipment: 'BODYWEIGHT', difficulty: 'BEGINNER',     instructions: 'Stand on step edge. Rise on toes. Lower heel below step.', isCustom: false },
  { id: 'ex-35', name: 'Hack Squat',              muscleGroup: 'QUADRICEPS', equipment: 'MACHINE',    difficulty: 'INTERMEDIATE', instructions: 'Position shoulders under pads. Squat deep. Drive through heels to return.', isCustom: false },
  { id: 'ex-36', name: 'Leg Extension',           muscleGroup: 'QUADRICEPS', equipment: 'MACHINE',    difficulty: 'BEGINNER',     instructions: 'Sit in machine. Extend legs until straight. Lower with control.', isCustom: false },
  { id: 'ex-37', name: 'Bulgarian Split Squat',   muscleGroup: 'QUADRICEPS', equipment: 'DUMBBELL',   difficulty: 'INTERMEDIATE', instructions: 'Rear foot elevated on bench. Squat down on front leg. Drive up through heel.', isCustom: false },
  { id: 'ex-38', name: 'Hip Thrust',              muscleGroup: 'HAMSTRINGS', equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Upper back on bench. Bar on hips. Drive hips up to full extension. Squeeze glutes.', isCustom: false },
  // ── Arms ────────────────────────────────────────────────────────────────────
  { id: 'ex-20', name: 'Barbell Curl',            muscleGroup: 'BICEPS',     equipment: 'BARBELL',    difficulty: 'BEGINNER',     instructions: 'Stand with barbell. Curl to shoulder height. Lower with control.', isCustom: false },
  { id: 'ex-21', name: 'Dumbbell Hammer Curl',    muscleGroup: 'BICEPS',     equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Neutral grip. Curl dumbbells keeping palms facing each other.', isCustom: false },
  { id: 'ex-22', name: 'Tricep Pushdown',         muscleGroup: 'TRICEPS',    equipment: 'CABLE',      difficulty: 'BEGINNER',     instructions: 'Grip bar overhead. Push down until arms straight. Control return.', isCustom: false },
  { id: 'ex-23', name: 'Skull Crusher',           muscleGroup: 'TRICEPS',    equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Lie on bench. Lower bar to forehead. Extend arms.', isCustom: false },
  { id: 'ex-39', name: 'Incline Dumbbell Curl',   muscleGroup: 'BICEPS',     equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Sit on incline bench. Let arms hang. Curl dumbbells with supination.', isCustom: false },
  { id: 'ex-40', name: 'Cable Curl',              muscleGroup: 'BICEPS',     equipment: 'CABLE',      difficulty: 'BEGINNER',     instructions: 'Face cable stack with low pulley. Curl bar toward chin. Hold peak contraction.', isCustom: false },
  { id: 'ex-41', name: 'Overhead Tricep Extension', muscleGroup: 'TRICEPS',  equipment: 'DUMBBELL',   difficulty: 'BEGINNER',     instructions: 'Hold dumbbell overhead with both hands. Lower behind head. Extend fully.', isCustom: false },
  { id: 'ex-42', name: 'Close-Grip Bench Press',  muscleGroup: 'TRICEPS',    equipment: 'BARBELL',    difficulty: 'INTERMEDIATE', instructions: 'Grip bar shoulder-width. Lower to lower chest. Press up focusing on triceps.', isCustom: false },
  // ── Core ────────────────────────────────────────────────────────────────────
  { id: 'ex-24', name: 'Plank',                   muscleGroup: 'CORE',       equipment: 'BODYWEIGHT', difficulty: 'BEGINNER',     instructions: 'Hold body straight on forearms and toes. Keep core braced.', isCustom: false },
  { id: 'ex-25', name: 'Crunches',                muscleGroup: 'CORE',       equipment: 'BODYWEIGHT', difficulty: 'BEGINNER',     instructions: 'Lie on back. Curl shoulders toward knees. Lower with control.', isCustom: false },
  { id: 'ex-26', name: 'Russian Twist',           muscleGroup: 'CORE',       equipment: 'BODYWEIGHT', difficulty: 'INTERMEDIATE', instructions: 'Sit with knees bent. Lean back slightly. Rotate torso side to side.', isCustom: false },
  { id: 'ex-43', name: 'Hanging Leg Raise',       muscleGroup: 'CORE',       equipment: 'BODYWEIGHT', difficulty: 'INTERMEDIATE', instructions: 'Hang from pull-up bar. Raise legs to 90 degrees. Lower with control.', isCustom: false },
  { id: 'ex-44', name: 'Cable Crunch',            muscleGroup: 'CORE',       equipment: 'CABLE',      difficulty: 'BEGINNER',     instructions: 'Kneel at high cable. Pull rope to crunch torso toward knees. Control return.', isCustom: false },
  // ── Cardio ──────────────────────────────────────────────────────────────────
  { id: 'ex-45', name: 'Treadmill Run',           muscleGroup: 'CARDIO',     equipment: 'MACHINE',    difficulty: 'BEGINNER',     instructions: 'Set desired speed. Run with relaxed shoulders, midfoot strike, and steady breathing.', isCustom: false },
  { id: 'ex-46', name: 'Jump Rope',               muscleGroup: 'CARDIO',     equipment: 'BODYWEIGHT', difficulty: 'BEGINNER',     instructions: 'Jump with both feet. Keep elbows close to sides. Land softly on balls of feet.', isCustom: false },
  { id: 'ex-47', name: 'Box Jump',                muscleGroup: 'CARDIO',     equipment: 'BODYWEIGHT', difficulty: 'INTERMEDIATE', instructions: 'Stand facing box. Jump explosively onto box. Step down carefully. Reset and repeat.', isCustom: false },
];

// ── Workout Templates ────────────────────────────────────────────────────────

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  daysPerWeek: number;
  days: Array<{
    name: string;
    exercises: Array<{
      exerciseId: string;
      targetSets: number;
      targetRepsMin: number;
      targetRepsMax: number;
      restSeconds: number;
    }>;
  }>;
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl-ppl',
    name: 'Push / Pull / Legs',
    description: '6-day split. Push muscles (chest, shoulders, triceps), pull muscles (back, biceps), and legs on alternating days. Excellent volume for intermediate lifters.',
    icon: 'repeat',
    difficulty: 'INTERMEDIATE',
    daysPerWeek: 6,
    days: [
      {
        name: 'Push A',
        exercises: [
          { exerciseId: 'ex-1',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-2',  targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-11', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-12', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-22', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-23', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 60 },
        ],
      },
      {
        name: 'Pull A',
        exercises: [
          { exerciseId: 'ex-7',  targetSets: 4, targetRepsMin: 4,  targetRepsMax: 6,  restSeconds: 180 },
          { exerciseId: 'ex-8',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-9',  targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-10', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-20', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 60 },
          { exerciseId: 'ex-21', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
        ],
      },
      {
        name: 'Legs A',
        exercises: [
          { exerciseId: 'ex-14', targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 180 },
          { exerciseId: 'ex-16', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120 },
          { exerciseId: 'ex-15', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-18', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-36', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-19', targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
      {
        name: 'Push B',
        exercises: [
          { exerciseId: 'ex-32', targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 90 },
          { exerciseId: 'ex-27', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-4',  targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-33', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-5',  targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-41', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
        ],
      },
      {
        name: 'Pull B',
        exercises: [
          { exerciseId: 'ex-6',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-29', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-31', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-13', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-39', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-40', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
        ],
      },
      {
        name: 'Legs B',
        exercises: [
          { exerciseId: 'ex-35', targetSets: 4, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-37', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-38', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-15', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-17', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 60 },
          { exerciseId: 'ex-19', targetSets: 4, targetRepsMin: 12, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: 'tpl-arnold',
    name: 'Arnold Split',
    description: '6-day split popularized by Arnold Schwarzenegger. Chest+Back, Shoulders+Arms, and Legs on alternating days. High volume for experienced lifters.',
    icon: 'arm-flex',
    difficulty: 'ADVANCED',
    daysPerWeek: 6,
    days: [
      {
        name: 'Chest & Back A',
        exercises: [
          { exerciseId: 'ex-1',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-8',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-2',  targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-9',  targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-4',  targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-31', targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 60 },
        ],
      },
      {
        name: 'Shoulders & Arms A',
        exercises: [
          { exerciseId: 'ex-32', targetSets: 4, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-12', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-13', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-20', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 60 },
          { exerciseId: 'ex-23', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 60 },
          { exerciseId: 'ex-21', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-22', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
        ],
      },
      {
        name: 'Legs A',
        exercises: [
          { exerciseId: 'ex-14', targetSets: 5, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 180 },
          { exerciseId: 'ex-16', targetSets: 4, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120 },
          { exerciseId: 'ex-15', targetSets: 4, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-18', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-19', targetSets: 5, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
      {
        name: 'Chest & Back B',
        exercises: [
          { exerciseId: 'ex-7',  targetSets: 4, targetRepsMin: 4,  targetRepsMax: 6,  restSeconds: 180 },
          { exerciseId: 'ex-5',  targetSets: 4, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-29', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-27', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-28', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-30', targetSets: 3, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 90 },
        ],
      },
      {
        name: 'Shoulders & Arms B',
        exercises: [
          { exerciseId: 'ex-11', targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-34', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-33', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-39', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-42', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-40', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-41', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
        ],
      },
      {
        name: 'Legs B',
        exercises: [
          { exerciseId: 'ex-35', targetSets: 4, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-37', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-38', targetSets: 4, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-36', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-19', targetSets: 5, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },
  {
    id: 'tpl-upper-lower',
    name: 'Upper / Lower',
    description: '4-day split alternating upper and lower body. Great balance of frequency and recovery. Ideal for beginners and intermediates.',
    icon: 'lightning-bolt',
    difficulty: 'BEGINNER',
    daysPerWeek: 4,
    days: [
      {
        name: 'Upper A',
        exercises: [
          { exerciseId: 'ex-1',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-8',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-2',  targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-9',  targetSets: 3, targetRepsMin: 10, targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-20', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 60 },
          { exerciseId: 'ex-22', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
        ],
      },
      {
        name: 'Lower A',
        exercises: [
          { exerciseId: 'ex-14', targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 180 },
          { exerciseId: 'ex-15', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 120 },
          { exerciseId: 'ex-16', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 120 },
          { exerciseId: 'ex-18', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-19', targetSets: 4, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
      {
        name: 'Upper B',
        exercises: [
          { exerciseId: 'ex-11', targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-6',  targetSets: 4, targetRepsMin: 6,  targetRepsMax: 10, restSeconds: 120 },
          { exerciseId: 'ex-12', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-10', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-21', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-23', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 60 },
        ],
      },
      {
        name: 'Lower B',
        exercises: [
          { exerciseId: 'ex-7',  targetSets: 4, targetRepsMin: 4,  targetRepsMax: 6,  restSeconds: 180 },
          { exerciseId: 'ex-37', targetSets: 3, targetRepsMin: 8,  targetRepsMax: 12, restSeconds: 90 },
          { exerciseId: 'ex-38', targetSets: 3, targetRepsMin: 10, targetRepsMax: 15, restSeconds: 90 },
          { exerciseId: 'ex-36', targetSets: 3, targetRepsMin: 12, targetRepsMax: 15, restSeconds: 60 },
          { exerciseId: 'ex-19', targetSets: 4, targetRepsMin: 15, targetRepsMax: 20, restSeconds: 60 },
        ],
      },
    ],
  },
];
