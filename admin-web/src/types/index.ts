export type ExerciseStatus = "DRAFT" | "REVIEWED" | "PUBLISHED" | "ARCHIVED" | "REJECTED";
export type MuscleGroup =
  | "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "FOREARMS"
  | "CORE" | "GLUTES" | "QUADRICEPS" | "HAMSTRINGS" | "CALVES"
  | "FULL_BODY" | "CARDIO" | "OTHER";
export type EquipmentType =
  | "BARBELL" | "DUMBBELL" | "MACHINE" | "CABLE" | "BODYWEIGHT"
  | "KETTLEBELL" | "RESISTANCE_BAND" | "SMITH_MACHINE" | "OTHER";
export type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type MediaType = "IMAGE" | "GIF" | "VIDEO" | "THUMBNAIL" | "SVG_OVERLAY" | "LOTTIE";

export interface Exercise {
  id: string;
  name: string;
  slug: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  difficulty: Difficulty;
  description?: string;
  instructions?: string;
  tips?: string;
  commonMistakes?: string;
  imageUrl?: string;
  gifUrl?: string;
  category?: string;
  movementPattern?: string;
  mechanic?: string;
  forceType?: string;
  tags: string[];
  status: ExerciseStatus;
  qualityScore: number;
  licenseType?: string;
  attribution?: string;
  sourceProvider?: string;
  externalId?: string;
  custom: boolean;
  publishedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseMedia {
  id: string;
  exerciseId: string;
  mediaType: MediaType;
  url: string;
  provider?: string;
  licenseType?: string;
  author?: string;
  sourceUrl?: string;
  attribution?: string;
  commercialUse: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface ExerciseTranslation {
  id: string;
  exerciseId: string;
  locale: string;
  name?: string;
  description?: string;
  instructions?: string;
  tips?: string;
  commonMistakes?: string;
}

export interface ImportHistory {
  id: string;
  provider: string;
  datasetVersion?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "ROLLED_BACK";
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  warningCount: number;
  mediaCount: number;
  durationMs?: number;
  errors: string[];
  warnings: string[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  adminUserId?: string;
  adminEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ActivityPoint {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalExercises: number;
  publishedExercises: number;
  draftExercises: number;
  reviewedExercises: number;
  archivedExercises: number;
  rejectedExercises: number;
  customExercises: number;
  totalImports: number;
  averageQualityScore: number;
  byMuscleGroup: Record<string, number>;
  byEquipment: Record<string, number>;
  byDifficulty: Record<string, number>;
  qualityScoreBuckets: Record<string, number>;
  activityTrend: ActivityPoint[];
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errorCode?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  createdAt: string;
  lastActiveAt?: string;
  online: boolean;
}

export interface AdminUserStats {
  totalUsers: number;
  onlineNow: number;
  newToday: number;
  newThisWeek: number;
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
}
