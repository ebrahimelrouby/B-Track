import { startWatchApp, WorkoutActivityType, WorkoutSessionLocationType } from '@kingstinct/react-native-healthkit';

/**
 * Tells the system to launch the paired Apple Watch's companion app and
 * start a real HKWorkoutSession there, in step with a workout starting on
 * the phone. This is what makes the watch actually start (heart rate,
 * calories, recorded into Health) instead of just mirroring UI state over
 * WatchConnectivity.
 */
export function startAppleWatchWorkout(): Promise<boolean> {
  return startWatchApp({
    activityType: WorkoutActivityType.traditionalStrengthTraining,
    locationType: WorkoutSessionLocationType.indoor,
  }).catch(() => false);
}
