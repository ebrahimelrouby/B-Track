// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  onboardingComplete: boolean;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

// ─── Profile ───────────────────────────────────────────────────────────────────

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type FitnessGoal = 'LOSE_FAT' | 'MAINTAIN' | 'GAIN_MUSCLE';
export type ActivityLevel = 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type TrainingExperience = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type DietaryPreference = 'NONE' | 'VEGETARIAN' | 'VEGAN' | 'KETO' | 'PALEO' | 'GLUTEN_FREE' | 'DAIRY_FREE';

export interface UserProfile {
  id: string;
  gender?: Gender;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  fitnessGoal?: FitnessGoal;
  activityLevel?: ActivityLevel;
  trainingExperience?: TrainingExperience;
  dietaryPreference?: DietaryPreference;
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatsG?: number;
  targetWaterMl?: number;
  targetSteps?: number;
  targetSleepHours?: number;
  targetActiveCalories?: number;
  avatarUrl?: string;
}

// ─── Subscription ──────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'FREE' | 'PREMIUM_MONTHLY' | 'PREMIUM_ANNUAL';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'GRACE_PERIOD' | 'TRIAL';

export type FeatureKey =
  | 'UNLIMITED_WORKOUT_PLANS'
  | 'UNLIMITED_CUSTOM_EXERCISES'
  | 'ADVANCED_ANALYTICS'
  | 'FULL_WORKOUT_HISTORY'
  | 'AI_COACH'
  | 'APPLE_WATCH_SYNC'
  | 'UNLIMITED_PROGRESS_PHOTOS'
  | 'ADVANCED_NUTRITION_TARGETS'
  | 'MEAL_TEMPLATES'
  | 'RECIPE_BUILDER'
  | 'CUSTOM_WATER_PRESETS'
  | 'DATA_EXPORT'
  | 'PRIORITY_CLOUD_BACKUP'
  | 'ADVANCED_PR_TRACKING'
  | 'MUSCLE_GROUP_ANALYTICS'
  | 'AI_FOOD_ESTIMATION'
  | 'AI_BODY_FAT_ESTIMATION';

export interface Entitlements {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isPremium: boolean;
  features: FeatureKey[];
  expiresAt?: string;
  maxWorkoutPlans: number;
  maxCustomExercises: number;
  maxProgressPhotos: number;
  workoutHistoryDays: number;
}

// ─── Exercises ─────────────────────────────────────────────────────────────────

export type MuscleGroup =
  | 'CHEST' | 'BACK' | 'SHOULDERS' | 'BICEPS' | 'TRICEPS' | 'FOREARMS'
  | 'CORE' | 'GLUTES' | 'QUADRICEPS' | 'HAMSTRINGS' | 'CALVES'
  | 'FULL_BODY' | 'CARDIO' | 'OTHER';

export type EquipmentType =
  | 'BARBELL' | 'DUMBBELL' | 'MACHINE' | 'CABLE' | 'BODYWEIGHT'
  | 'KETTLEBELL' | 'RESISTANCE_BAND' | 'SMITH_MACHINE' | 'OTHER';

export type ExerciseDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: EquipmentType;
  difficulty: ExerciseDifficulty;
  instructions?: string;
  tips?: string;
  imageUrl?: string;
  gifUrl?: string;
  isCustom: boolean;
  // Custom exercises only — lets a user pick their own icon/color instead of
  // the default muscle-group-derived one.
  iconName?: string;
  iconColor?: string;
}

// ─── Workout Plans ─────────────────────────────────────────────────────────────

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  days: WorkoutDay[];
  createdAt: string;
}

export interface WorkoutDay {
  id: string;
  planId: string;
  name: string;
  sortOrder: number;
  exercises: WorkoutDayExercise[];
}

export interface WorkoutDayExercise {
  id: string;
  exercise: Exercise;
  sortOrder: number;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetWeightKg?: number;
  restSeconds?: number;
  notes?: string;
}

// ─── Active Workout (local) ─────────────────────────────────────────────────────

export type SetType = 'NORMAL' | 'WARMUP' | 'DROP_SET' | 'FAILURE' | 'AMRAP' | 'TEMPO';

export interface ActiveSet {
  localId: string;
  setNumber: number;
  setType: SetType;
  weightKg?: number;
  reps?: number;
  rpe?: number;
  restSeconds?: number;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ActiveExercise {
  localId: string;
  exercise: Exercise;
  sortOrder: number;
  sets: ActiveSet[];
  notes?: string;
  restTimerSeconds?: number;
}

export interface ActiveWorkout {
  localSessionId: string;
  planId?: string;
  dayId?: string;
  name: string;
  startedAt: string;
  pausedAt?: string;
  isPaused: boolean;
  exercises: ActiveExercise[];
  notes?: string;
}

// ─── Session ───────────────────────────────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  name: string;
  status: 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  totalVolumeKg?: number;
  exercises: SessionExercise[];
  notes?: string;
}

export interface SessionExercise {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  setType: SetType;
  weightKg?: number;
  reps?: number;
  rpe?: number;
  restSeconds?: number;
  notes?: string;
  isCompleted: boolean;
  completedAt?: string;
}

// ─── Nutrition ─────────────────────────────────────────────────────────────────

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK' | 'PRE_WORKOUT' | 'POST_WORKOUT';

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSizeG: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  isCustom: boolean;
}

export interface Meal {
  id: string;
  mealType: MealType;
  loggedDate: string;
  items: MealItem[];
}

export interface MealItem {
  id: string;
  foodItem: FoodItem;
  quantity: number;
  servingSizeG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatsG: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatsG: number;
  meals: Meal[];
}

// ─── Water ─────────────────────────────────────────────────────────────────────

export interface WaterLog {
  id: string;
  amountMl: number;
  loggedAt: string;
}

export interface DailyWater {
  date: string;
  totalMl: number;
  targetMl: number;
  logs: WaterLog[];
}

// ─── Sleep ─────────────────────────────────────────────────────────────────────

export type SleepQuality = 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';

export interface SleepLog {
  id: string;
  date: string;
  bedtime: string;        // ISO datetime
  wakeTime: string;       // ISO datetime
  durationMinutes: number;
  quality: SleepQuality;
  notes?: string;
  createdAt: string;
}

export interface DailySleep {
  date: string;
  logs: SleepLog[];
  totalMinutes: number;
  targetMinutes: number;
  quality: SleepQuality | null;
}

export interface SleepLogRequest {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: SleepQuality;
  notes?: string;
  source?: string;
}

// ─── Steps ─────────────────────────────────────────────────────────────────────

export interface DailySteps {
  date: string;
  steps: number;
  targetSteps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeMinutes: number;
}

export interface StepsLogRequest {
  date: string;
  steps: number;
  source?: string;
  caloriesBurned?: number;
}

// ─── API Response ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: string;
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

// ─── AI Features ───────────────────────────────────────────────────────────────

export type AiInputType = 'TEXT' | 'PHOTO' | 'VOICE';
export type AiEstimateStatus = 'DRAFT' | 'SAVED' | 'DISCARDED';

export interface AiNutritionEstimate {
  id: string;
  inputType: AiInputType;
  inputText?: string;
  foodName?: string;
  estimatedCalories?: number;
  estimatedProteinG?: number;
  estimatedCarbsG?: number;
  estimatedFatG?: number;
  estimatedFiberG?: number;
  estimatedSugarG?: number;
  estimatedSodiumMg?: number;
  estimatedServingG?: number;
  confirmedCalories?: number;
  confirmedProteinG?: number;
  confirmedCarbsG?: number;
  confirmedFatG?: number;
  confirmedServingG?: number;
  confidenceScore?: number;
  assumptions?: string[];
  status: AiEstimateStatus;
  mealType?: string;
  loggedDate?: string;
  createdAt?: string;
}

export interface AiNutritionTextRequest {
  description: string;
}

export interface AiNutritionSaveRequest {
  foodName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  servingG?: number;
  mealType?: string;
  loggedDate?: string;
}

export interface AiBodyFatEstimate {
  id: string;
  minBodyFatPct: number;
  maxBodyFatPct: number;
  confidenceScore?: number;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  trainingExperience?: string;
  visualObservations?: string[];
  recommendations?: string[];
  status: AiEstimateStatus;
  createdAt?: string;
}

export interface AiBodyFatMetadata {
  consentGiven: boolean;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: string;
  trainingExperience?: string;
  goal?: string;
}

// ─── Recovery Score ────────────────────────────────────────────────────────────

export type RecoveryLevel =
  | 'READY_FOR_HEAVY_TRAINING'
  | 'READY_FOR_NORMAL_TRAINING'
  | 'MODERATE_TRAINING_RECOMMENDED'
  | 'LIGHT_ACTIVITY_RECOMMENDED'
  | 'REST_RECOMMENDED';

export type ComponentStatus = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN';

export type RecommendationType = 'TRAINING' | 'SLEEP' | 'HYDRATION' | 'NUTRITION' | 'GENERAL';

export interface RecoveryComponent {
  score: number;          // 0-100
  status: ComponentStatus;
  explanation: string;
  confidence: number;     // 0-1
}

export interface RecoveryRecommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: number;
}

export interface RecoveryComponentBreakdown {
  sleep:              RecoveryComponent;
  trainingLoad:       RecoveryComponent;
  heartRecovery:      RecoveryComponent;
  hydration:          RecoveryComponent;
  subjectiveWellness: RecoveryComponent;
}

export interface RecoveryScore {
  id: string;
  date: string;
  recoveryScore: number;
  recoveryLevel: RecoveryLevel;
  confidence: number;
  components: RecoveryComponentBreakdown;
  recommendations: RecoveryRecommendation[];
  missingData: string[];
  disclaimer: string;
}

export interface RecoveryCheckIn {
  id: string;
  date: string;
  energyLevel: number;      // 1-5
  sorenessLevel: number;    // 1-5
  stressLevel: number;      // 1-5
  moodLevel: number;        // 1-5
  motivationLevel: number;  // 1-5
  notes?: string;
  createdAt?: string;
}

export interface RecoveryCheckInRequest {
  date?: string;
  energyLevel: number;
  sorenessLevel: number;
  stressLevel: number;
  moodLevel: number;
  motivationLevel: number;
  notes?: string;
}
