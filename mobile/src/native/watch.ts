import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

/**
 * State snapshot pushed to the Apple Watch / Wear OS companion apps.
 * Both native sides store this verbatim and compute live countdowns
 * (elapsed time, rest timer) locally from the epoch-ms timestamps instead
 * of receiving a per-second stream over Bluetooth.
 */
export interface WatchWorkoutState {
  isActive: boolean;
  workoutName?: string;
  startedAtMs?: number;
  isPaused?: boolean;
  currentExerciseName?: string;
  lastWeightKg?: number;
  lastReps?: number;
  /** epoch ms when the current rest timer ends; absent/undefined = no rest active */
  restEndTimeMs?: number;
}

export type WatchAction = 'startWorkout' | 'logSet' | 'finishWorkout' | 'skipRest';

const watchModule = NativeModules.WatchBridge;

export function pushWorkoutStateToWatch(state: WatchWorkoutState): void {
  watchModule?.updateWorkoutState(state);
}

export function subscribeToWatchActions(handler: (action: WatchAction) => void): () => void {
  if (!watchModule) return () => {};
  const emitter = new NativeEventEmitter(Platform.OS === 'ios' ? watchModule : undefined);
  const sub = emitter.addListener('WatchAction', (event: { action: WatchAction }) => handler(event.action));
  return () => sub.remove();
}
