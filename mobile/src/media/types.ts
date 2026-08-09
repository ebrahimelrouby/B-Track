import { MuscleGroup } from '@/types';

// ── Provider identity ─────────────────────────────────────────────────────────

export type MediaProviderID =
  | 'free-exercise-db'   // yuhonas/free-exercise-db (MIT)
  | 'exercisedb'         // ExerciseDB / RapidAPI (proprietary)
  | 'wger'               // wger open-source project (AGPL)
  | 'custom'             // self-hosted / licensed library
  | 'mock';              // built-in animated fallback, no external deps

export type LicenseType =
  | 'MIT'
  | 'CC0-1.0'
  | 'CC-BY-4.0'
  | 'CC-BY-SA-4.0'
  | 'AGPL-3.0'
  | 'proprietary'
  | 'unknown';

// ── Core media object ─────────────────────────────────────────────────────────

export interface ExerciseMedia {
  exerciseId: string;

  // Progressive media — displayed in preference order: gif → image → animation
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;

  // Muscle visualization layers
  svgMuscleIllustration?: string;
  primaryMuscleOverlay?: string;
  secondaryMuscleOverlay?: string;

  // Attribution (must be displayed when mediaProvider !== 'mock')
  mediaProvider: MediaProviderID;
  licenseType: LicenseType;
  attribution?: string;
  attributionUrl?: string;
}

// ── Resolution context passed to providers ────────────────────────────────────

export interface MediaResolutionContext {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
}
