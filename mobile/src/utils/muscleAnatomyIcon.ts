import { ImageSourcePropType } from 'react-native';
import { MuscleGroup } from '@/types';

// Anatomical muscle-group icons — a step more specific than the generic
// vector glyphs in exerciseIcon.ts (e.g. a literal back silhouette instead
// of a generic rowing icon), but less specific than exercisePictogram.ts's
// per-movement pictograms. Used as the middle fallback layer: specific
// movement pictogram > this anatomy icon > generic vector glyph.
// BICEPS and CARDIO have no dedicated art yet, so they fall through to the
// generic vector glyph.
const MUSCLE_ANATOMY_ICONS: Partial<Record<MuscleGroup, ImageSourcePropType>> = {
  CHEST: require('@/assets/images/exercise-icons/chest_anatomy.png'),
  BACK: require('@/assets/images/exercise-icons/upper_back_anatomy.png'),
  SHOULDERS: require('@/assets/images/exercise-icons/shoulder_anatomy.png'),
  TRICEPS: require('@/assets/images/exercise-icons/triceps_anatomy.png'),
  CORE: require('@/assets/images/exercise-icons/core_anatomy.png'),
  QUADRICEPS: require('@/assets/images/exercise-icons/quads_anatomy.png'),
  HAMSTRINGS: require('@/assets/images/exercise-icons/hamstrings_anatomy.png'),
  GLUTES: require('@/assets/images/exercise-icons/glutes_anatomy.png'),
  CALVES: require('@/assets/images/exercise-icons/calves_anatomy.png'),
  FULL_BODY: require('@/assets/images/exercise-icons/fullbody_anatomy.png'),
};

export function muscleAnatomyIcon(muscleGroup: MuscleGroup): ImageSourcePropType | null {
  return MUSCLE_ANATOMY_ICONS[muscleGroup] ?? null;
}
