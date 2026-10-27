import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { RootStackParamList } from './types';
import { useColors } from '@/theme';
import { navigationRef, navigateToAlarmRinging } from './navigationRef';
import { userApi } from '@/api/user.api';
import { useHealthAutoSync } from '@/hooks/useHealthAutoSync';
import { takePendingAlarmId } from '@/services/pendingAlarm';

import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import LockedFeatureScreen from '@/screens/premium/LockedFeatureScreen';
import UpgradeScreen from '@/screens/premium/UpgradeScreen';
import AiNavigator from './AiNavigator';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';
import AlarmRingingScreen from '@/screens/sleep/AlarmRingingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user, setEntitlements } = useAuthStore();
  const colors = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  // Without this, `entitlements` in the auth store stays null forever — every
  // premium check (usePremiumFeature/usePlanLimit) silently treats every user
  // as free, even right after a real purchase succeeds server-side.
  const { data: entitlements } = useQuery({
    queryKey: ['entitlements'],
    queryFn: userApi.getEntitlements,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (entitlements) setEntitlements(entitlements);
  }, [entitlements, setEntitlements]);

  useHealthAutoSync(isAuthenticated);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Picks up an alarm id stashed by index.js's background notification
        // handler (app was backgrounded/killed when the alarm notification
        // was pressed) — navigationRef wasn't ready yet at that point.
        const alarmId = takePendingAlarmId();
        if (alarmId) navigateToAlarmRinging(alarmId);
      }}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: 'transparent',
          card: colors.surface,
          text: colors.textPrimary,
          border: colors.surfaceBorder,
          notification: colors.primary,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/*
          Conditional screen rendering is the React Navigation way to handle auth flows.
          When the condition changes, React Navigation automatically resets to the
          first available screen in the new set.
        */}
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !user?.onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="LockedFeature"
              component={LockedFeatureScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Upgrade"
              component={UpgradeScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="AiStack"
              component={AiNavigator}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="AlarmRinging"
              component={AlarmRingingScreen}
              options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
