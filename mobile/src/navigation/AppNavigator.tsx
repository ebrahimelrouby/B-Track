import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { RootStackParamList } from './types';
import { useColors } from '@/theme';

import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import LockedFeatureScreen from '@/screens/premium/LockedFeatureScreen';
import UpgradeScreen from '@/screens/premium/UpgradeScreen';
import AiNavigator from './AiNavigator';
import NotificationsScreen from '@/screens/notifications/NotificationsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const colors = useColors();
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <NavigationContainer
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
