import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { withIAPContext } from 'react-native-iap';

import '@/i18n';
import AppNavigator from '@/navigation/AppNavigator';
import { subscribeToWatchActions } from '@/native/watch';
import { navigateToActiveWorkout } from '@/navigation/navigationRef';
import { useActiveWorkoutStore } from '@/store/activeWorkout.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 0,
    },
  },
});

function App() {
  // Global watch listener — lets the watch start a workout even when
  // ActiveWorkoutScreen isn't mounted yet. Once a workout is active, the
  // screen's own listener (ActiveWorkoutScreen.tsx) takes over for
  // logSet/finishWorkout/skipRest, so this only ever reacts to startWorkout.
  useEffect(() => subscribeToWatchActions((action) => {
    if (action !== 'startWorkout') return;
    if (useActiveWorkoutStore.getState().isWorkoutActive) return;
    useActiveWorkoutStore.getState().startWorkout({ name: 'Quick Workout' });
    navigateToActiveWorkout('Quick Workout');
  }), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// useIAP() (used by UpgradeScreen) throws "You need wrap your app with
// withIAPContext HOC" unless the root component is wrapped like this.
export default withIAPContext(App);
