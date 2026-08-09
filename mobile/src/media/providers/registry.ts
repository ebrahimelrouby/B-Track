/**
 * Media provider registry.
 *
 * Providers are tried in order. The first non-null result wins.
 * mockProvider is always appended as the final fallback.
 *
 * To add a new provider (e.g. a licensed library):
 *   1. Implement IMediaProvider in a new file
 *   2. Add the instance to PROVIDERS below
 *   3. Nothing else needs to change
 */

import { IMediaProvider } from './IMediaProvider';
import { freeExerciseDbProvider } from './freeExerciseDbProvider';
import { mockProvider } from './mockProvider';
import { ExerciseMedia, MediaResolutionContext } from '../types';

const PROVIDERS: IMediaProvider[] = [
  freeExerciseDbProvider,
  // exerciseDbProvider,   // RapidAPI ExerciseDB — add API key in env
  // wgerProvider,         // wger open-source fitness platform
  // customProvider,       // self-hosted / licensed library
];

/**
 * Walk the provider chain and return the first non-null result.
 * Always returns a valid ExerciseMedia (mock fallback ensures this).
 */
export function resolveExerciseMedia(ctx: MediaResolutionContext): ExerciseMedia {
  for (const provider of PROVIDERS) {
    const media = provider.resolve(ctx);
    if (media) return media;
  }
  return mockProvider.resolve(ctx) as ExerciseMedia;
}

/** Exposed for settings/attribution UI */
export function getRegisteredProviders(): IMediaProvider[] {
  return [...PROVIDERS, mockProvider];
}
