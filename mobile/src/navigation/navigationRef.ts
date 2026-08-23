import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from './types';

/**
 * Lets code outside the React tree (native watch action listeners) trigger
 * navigation — e.g. jumping to the active workout screen when a workout is
 * started from the Apple Watch / Wear OS companion app.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToActiveWorkout(workoutName: string): void {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate(
    'Main' as never,
    {
      screen: 'Workout',
      params: { screen: 'ActiveWorkout', params: { workoutName } },
    } as never
  );
}
