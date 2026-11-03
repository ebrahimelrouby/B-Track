import { ImageSourcePropType } from 'react-native';

// A small set of real, specific exercise pictograms (black silhouette on
// transparent, tintable via the Image `tintColor` style) — matched against
// the exercise name for a much more expressive icon than the generic
// muscle-group/keyword glyphs in exerciseIcon.ts can give. Only exercises
// that genuinely match one of these specific movements get a pictogram;
// everything else keeps using the vector-icon fallback. Every pattern here
// has been checked against the real exercise library (not just eyeballed)
// to confirm it only matches what it's meant to.
const PICTOGRAMS: [RegExp, ImageSourcePropType][] = [
  // Order matters — more specific patterns first so e.g. "Incline Barbell
  // Bench Press" matches the incline pictogram, not the flat bench one.
  [/incline.*barbell.*(press|bench)|barbell.*incline.*(press|bench)/i, require('@/assets/images/exercise-icons/14_incline_barbell_press.png')],
  [/barbell.*(bench press|lying.*press)|lying barbell press/i, require('@/assets/images/exercise-icons/04_lying_barbell_press.png')],
  [/barbell.*(overhead|military|shoulder).*press|standing barbell press/i, require('@/assets/images/exercise-icons/standing_barbell_press_v2.png')],
  [/dumbbell.*(overhead|shoulder|military).*press|standing dumbbell press/i, require('@/assets/images/exercise-icons/01_standing_dumbbell_press.png')],
  [/lateral raise/i, require('@/assets/images/exercise-icons/12_dumbbell_lateral_raise.png')],
  [/overhead raise|front raise/i, require('@/assets/images/exercise-icons/03_overhead_raise.png')],
  [/dumbbell curl/i, require('@/assets/images/exercise-icons/06_standing_dumbbell_curl.png')],
  // Checked before the general squat pattern below so "Overhead Squat" /
  // "Thruster" / "Snatch Balance" get their own locked-out-overhead pose
  // instead of the plain back-squat pictogram.
  [/overhead squat|\bthruster\b|snatch balance/i, require('@/assets/images/exercise-icons/overhead_squat_thruster.png')],
  [/barbell.*squat|back squat|front squat/i, require('@/assets/images/exercise-icons/07_barbell_squat.png')],
  [/good morning/i, require('@/assets/images/exercise-icons/good_morning.png')],
  [/skull\s*crusher|lying.*tricep.*extension/i, require('@/assets/images/exercise-icons/skullcrusher_lying_triceps.png')],
  [/push[\s-]?up/i, require('@/assets/images/exercise-icons/floor_pushup_v2.png')],
  // Excludes "Jerk Dip Squat" (a squat/jerk variant, not a tricep dip) and
  // "Dip Machine" (different equipment than the parallel-bar pictogram).
  [/\bdip\b(?!.*\b(?:squat|machine)\b)/i, require('@/assets/images/exercise-icons/09_parallel_bar_dip.png')],
  [/pull[\s-]?up|chin[\s-]?up/i, require('@/assets/images/exercise-icons/pullup_bar_v2.png')],
  [/lat pulldown|pulldown/i, require('@/assets/images/exercise-icons/10_lat_pulldown.png')],
  // Pullover variants train the lats without a pulldown machine or pull-up
  // bar, so they fall outside both of those pictograms above — "Front Raise
  // And Pullover" is still intercepted by the front-raise pattern earlier
  // in this list, which is correct (that one's a front-delt move primarily).
  [/pullover|\boverhead lat\b/i, require('@/assets/images/exercise-icons/lats_anatomy.png')],
  [/leg press/i, require('@/assets/images/exercise-icons/leg_press_v2.png')],
  // "barbell" required explicitly — a looser "bent-over row" catch-all was
  // matching dumbbell/cable rows to the barbell pictogram.
  [/barbell.*row|row.*barbell/i, require('@/assets/images/exercise-icons/15_barbell_row.png')],
  [/treadmill|running/i, require('@/assets/images/exercise-icons/13_treadmill_running.png')],
  [/stationary bike|exercise bike|\bcycling\b/i, require('@/assets/images/exercise-icons/16_stationary_bike.png')],
];

export function exercisePictogram(name: string): ImageSourcePropType | null {
  const match = PICTOGRAMS.find(([re]) => re.test(name));
  return match ? match[1] : null;
}
