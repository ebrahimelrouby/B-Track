import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HealthStackParamList } from './types';

import HealthHubScreen        from '@/screens/health/HealthHubScreen';
import RecoveryDetailsScreen  from '@/screens/recovery/RecoveryDetailsScreen';
import RecoveryHistoryScreen  from '@/screens/recovery/RecoveryHistoryScreen';
import RecoveryCheckInScreen  from '@/screens/recovery/RecoveryCheckInScreen';
import RecoverySettingsScreen from '@/screens/recovery/RecoverySettingsScreen';
import SleepScreen            from '@/screens/sleep/SleepScreen';
import StepsScreen            from '@/screens/steps/StepsScreen';
import HydrationScreen        from '@/screens/water/HydrationScreen';
import CaloriesScreen         from '@/screens/calories/CaloriesScreen';
import SmartAlarmScreen       from '@/screens/sleep/SmartAlarmScreen';
import CreateAlarmScreen      from '@/screens/sleep/CreateAlarmScreen';

const Stack = createNativeStackNavigator<HealthStackParamList>();

export default function HealthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HealthHub"        component={HealthHubScreen} />
      <Stack.Screen name="RecoveryDetails"  component={RecoveryDetailsScreen} />
      <Stack.Screen name="RecoveryHistory"  component={RecoveryHistoryScreen} />
      <Stack.Screen
        name="RecoveryCheckIn"
        component={RecoveryCheckInScreen}
        options={{ presentation: 'formSheet', headerShown: false }}
      />
      <Stack.Screen name="RecoverySettings" component={RecoverySettingsScreen} />
      <Stack.Screen name="SleepScreen"      component={SleepScreen} />
      <Stack.Screen name="StepsScreen"      component={StepsScreen} />
      <Stack.Screen name="HydrationScreen"  component={HydrationScreen} />
      <Stack.Screen name="CaloriesScreen"   component={CaloriesScreen} />
      <Stack.Screen name="SmartAlarm"       component={SmartAlarmScreen} />
      <Stack.Screen
        name="CreateAlarm"
        component={CreateAlarmScreen}
        options={{ presentation: 'formSheet', headerShown: false }}
      />
    </Stack.Navigator>
  );
}
