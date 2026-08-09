import { ExerciseMedia, LicenseType, MediaProviderID, MediaResolutionContext } from '../types';

/**
 * Implement this interface to integrate any exercise media library.
 * Register the implementation in registry.ts — no other files need to change.
 */
export interface IMediaProvider {
  /** Stable identifier used in ExerciseMedia.mediaProvider */
  readonly id: MediaProviderID;
  /** Human-readable name shown in attribution UI */
  readonly displayName: string;
  readonly licenseType: LicenseType;
  /** Short attribution string, e.g. "yuhonas/free-exercise-db" */
  readonly attribution: string;
  /** URL to the provider's license or source page */
  readonly attributionUrl: string;

  /**
   * Return ExerciseMedia for the given exercise, or null if this provider
   * does not have data for it (the registry will try the next provider).
   */
  resolve(ctx: MediaResolutionContext): ExerciseMedia | null;
}
