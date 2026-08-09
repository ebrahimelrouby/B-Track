/**
 * Provider: mock (built-in animated fallback)
 *
 * Returns an empty media object with no URLs. ExerciseMediaView detects
 * the absence of URLs and renders the built-in ExerciseAnimation component.
 * No network access, no attribution required, works fully offline.
 *
 * This provider is always last in the registry — it matches every exercise.
 */

import { IMediaProvider } from './IMediaProvider';
import { ExerciseMedia, MediaResolutionContext } from '../types';

export const mockProvider: IMediaProvider = {
  id:             'mock',
  displayName:    'Built-in Animation',
  licenseType:    'MIT',
  attribution:    'B-Track built-in exercise animations',
  attributionUrl: '',

  resolve(ctx: MediaResolutionContext): ExerciseMedia {
    return {
      exerciseId:    ctx.exerciseId,
      mediaProvider: 'mock',
      licenseType:   'MIT',
    };
  },
};
