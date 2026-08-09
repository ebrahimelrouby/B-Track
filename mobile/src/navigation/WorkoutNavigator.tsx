import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutStackParamList } from './types';
import { useColors } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PremiumTag from '@/components/common/PremiumTag';

import WorkoutPlansScreen from '@/screens/workout/WorkoutPlansScreen';
import CreateWorkoutPlanScreen from '@/screens/workout/CreateWorkoutPlanScreen';
import WorkoutPlanDetailScreen from '@/screens/workout/WorkoutPlanDetailScreen';
import WorkoutDayScreen from '@/screens/workout/WorkoutDayScreen';
import ExerciseListScreen from '@/screens/workout/ExerciseListScreen';
import ExerciseDetailScreen from '@/screens/workout/ExerciseDetailScreen';
import ActiveWorkoutScreen from '@/screens/workout/ActiveWorkoutScreen';
import WorkoutSummaryScreen from '@/screens/workout/WorkoutSummaryScreen';
import WorkoutHistoryScreen from '@/screens/workout/WorkoutHistoryScreen';
import SessionDetailScreen from '@/screens/workout/SessionDetailScreen';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutNavigator() {
  const colors = useColors();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="WorkoutPlans"
        component={WorkoutPlansScreen}
        options={({ navigation }) => ({
          title: 'Workouts',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => (navigation as any).getParent()?.navigate('Dashboard')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginRight: 8 }}
            >
              <Icon name="chevron-left" size={26} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
          headerRight: () => <PremiumTag />,
        })}
      />
      <Stack.Screen name="CreateWorkoutPlan" component={CreateWorkoutPlanScreen} options={{ title: 'New Plan' }} />
      <Stack.Screen name="WorkoutPlanDetail" component={WorkoutPlanDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="WorkoutDay" component={WorkoutDayScreen} options={{ title: '' }} />
      <Stack.Screen name="ExerciseList" component={ExerciseListScreen} options={{ title: 'Exercises' }} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} options={{ title: '' }} />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} options={{ title: 'Summary', headerLeft: () => null }} />
      <Stack.Screen name="WorkoutHistory" component={WorkoutHistoryScreen} options={{ title: 'History' }} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
