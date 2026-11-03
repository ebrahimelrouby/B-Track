import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Exercise, MuscleGroup } from '@/types';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { method: 'email' | 'sms'; contact: string };
};

// Onboarding Stack
export type OnboardingStackParamList = {
  OnboardingFlow: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Workout:   undefined;
  Nutrition: undefined;
  Health:    undefined;
  Progress:  undefined;
  Profile:   undefined;
};

// Workout Stack (inside the Workout tab)
export type WorkoutStackParamList = {
  WorkoutPlans: undefined;
  CreateWorkoutPlan: undefined;
  WorkoutPlanDetail: { planId: string };
  WorkoutDay: { dayId: string; dayName: string };
  ExerciseList: { dayId?: string; mode: 'select' | 'browse'; muscleGroup?: MuscleGroup };
  ExerciseDetail: { exercise: Exercise };
  ActiveWorkout: { planId?: string; dayId?: string; workoutName: string };
  WorkoutSummary: { sessionId: string; name: string; durationSeconds: number; totalVolumeKg: number; totalSets: number; exerciseCount: number; avgHeartRate?: number; maxHeartRate?: number; activeCalories?: number };
  WorkoutHistory: undefined;
  WorkoutVitals: undefined;
  SessionDetail: { sessionId: string };
  TemplateDetail: { templateId: string };
};

// AI Stack
export type AiStackParamList = {
  AiFoodEntry: undefined;
  AiEstimateReview: { estimateId: string };
  AiNutritionHistory: undefined;
  AiBodyFatConsent: undefined;
  AiBodyFatPhoto: { consentGiven: true; heightCm?: number; weightKg?: number; age?: number; gender?: string; trainingExperience?: string; goal?: string };
  AiBodyFatResult: { estimateId: string };
  AiBodyFatHistory: undefined;
  BodyScanVisualization: { minBodyFatPct: number; maxBodyFatPct: number; gender?: string; category?: string };
};

// Health / Recovery Stack (inside Health tab)
export type HealthStackParamList = {
  HealthHub:         undefined;
  RecoveryDetails:   { date: string };
  RecoveryHistory:   undefined;
  RecoveryCheckIn:   { date?: string };
  RecoverySettings:  undefined;
  SleepScreen:       undefined;
  StepsScreen:       undefined;
  HydrationScreen:   undefined;
  CaloriesScreen:    undefined;
  SmartAlarm:        undefined;
  CreateAlarm:       { recommendedTime?: string; cycles?: number } | undefined;
};

// Root navigator
export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  LockedFeature: { feature: string; title: string; description: string };
  Upgrade: undefined;
  AiStack: NavigatorScreenParams<AiStackParamList> | undefined;
  Notifications: undefined;
  AlarmRinging: { alarmId: string };
};

// Navigation prop helpers
export type RootNavigationProp     = NativeStackNavigationProp<RootStackParamList>;
export type AuthNavigationProp     = NativeStackNavigationProp<AuthStackParamList>;
export type WorkoutNavigationProp  = NativeStackNavigationProp<WorkoutStackParamList>;
export type AiNavigationProp       = NativeStackNavigationProp<AiStackParamList>;
export type HealthNavigationProp   = NativeStackNavigationProp<HealthStackParamList>;
export type MainTabNavigationProp  = BottomTabNavigationProp<MainTabParamList>;

// Composite prop for screens that live in a tab but also need to push the root AI modal
export type DashboardNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;
