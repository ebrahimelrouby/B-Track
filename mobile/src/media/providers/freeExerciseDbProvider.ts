/**
 * Provider: yuhonas/free-exercise-db
 * License : MIT
 * Source  : https://github.com/yuhonas/free-exercise-db
 *
 * Hosts static exercise images (JPG) and animated GIFs on GitHub raw CDN.
 * No API key required. Attribution required by MIT license.
 */

import { IMediaProvider } from './IMediaProvider';
import { ExerciseMedia, MediaResolutionContext } from '../types';

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

/**
 * Maps internal exercise IDs → folder names in the free-exercise-db repo.
 * Add or update entries here when exercises are added to the seed data.
 */
const EXERCISE_PATHS: Record<string, string> = {
  // Chest
  'ex-1':  'Barbell_Bench_Press_-_Medium_Grip',
  'ex-2':  'Incline_Dumbbell_Press',
  'ex-3':  'Clock_Push-Up',
  'ex-4':  'Flat_Bench_Cable_Flyes',
  'ex-5':  'Bench_Dips',
  'ex-27': 'Decline_Barbell_Bench_Press',
  'ex-28': 'Decline_Dumbbell_Flyes',

  // Back
  'ex-6':  'Band_Assisted_Pull-Up',
  'ex-7':  'Barbell_Deadlift',
  'ex-8':  'Reverse_Grip_Bent-Over_Rows',
  'ex-9':  'Close-Grip_Front_Lat_Pulldown',
  'ex-10': 'Seated_Cable_Rows',
  'ex-29': 'Lying_T-Bar_Row',
  'ex-30': 'Chin-Up',
  'ex-31': 'Bent_Over_Two-Dumbbell_Row',

  // Shoulders
  'ex-11': 'Barbell_Shoulder_Press',
  'ex-12': 'Cable_Seated_Lateral_Raise',
  'ex-13': 'Face_Pull',
  'ex-32': 'Kettlebell_Arnold_Press',
  'ex-33': 'Front_Raise_And_Pullover',
  'ex-34': 'Barbell_Rear_Delt_Row',

  // Legs
  'ex-14': 'Barbell_Full_Squat',
  'ex-15': 'Romanian_Deadlift',
  'ex-16': 'Leg_Press',
  'ex-17': 'Dumbbell_Lunges',
  'ex-18': 'Ball_Leg_Curl',
  'ex-19': 'Barbell_Seated_Calf_Raise',
  'ex-35': 'Hack_Squat',
  'ex-36': 'Leg_Extensions',
  'ex-37': 'Barbell_Full_Squat',
  'ex-38': 'Barbell_Hip_Thrust',

  // Biceps
  'ex-20': 'Barbell_Curl',
  'ex-21': 'Alternate_Hammer_Curl',
  'ex-39': 'Incline_Dumbbell_Curl',
  'ex-40': 'Cable_Hammer_Curls_-_Rope_Attachment',

  // Triceps
  'ex-22': 'Reverse_Grip_Triceps_Pushdown',
  'ex-23': 'Band_Skull_Crusher',
  'ex-41': 'Cable_Rope_Overhead_Triceps_Extension',
  'ex-42': 'Close-Grip_Barbell_Bench_Press',

  // Core
  'ex-24': 'Plank',
  'ex-25': 'Crunches',
  'ex-26': 'Russian_Twist',
  'ex-43': 'Hanging_Leg_Raise',
  'ex-44': 'Cable_Crunch',

  // Cardio
  'ex-45': 'Jogging_Treadmill',
  'ex-46': 'Rope_Jumping',
  'ex-47': 'Box_Jump_Multiple_Response',
};

export const freeExerciseDbProvider: IMediaProvider = {
  id:             'free-exercise-db',
  displayName:    'Free Exercise DB',
  licenseType:    'MIT',
  attribution:    'yuhonas/free-exercise-db',
  attributionUrl: 'https://github.com/yuhonas/free-exercise-db',

  resolve(ctx: MediaResolutionContext): ExerciseMedia | null {
    const folder = EXERCISE_PATHS[ctx.exerciseId];
    if (!folder) return null;

    const base = `${BASE}/${folder}`;
    return {
      exerciseId:     ctx.exerciseId,
      imageUrl:       `${base}/0.jpg`,
      gifUrl:         `${base}/0.gif`,
      thumbnailUrl:   `${base}/0.jpg`,
      mediaProvider:  'free-exercise-db',
      licenseType:    'MIT',
      attribution:    'yuhonas/free-exercise-db',
      attributionUrl: 'https://github.com/yuhonas/free-exercise-db',
    };
  },
};
