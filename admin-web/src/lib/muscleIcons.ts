// Same muscle-anatomy silhouette images used in the mobile app's "By Muscle
// Group" grid and exercise list fallback icon — kept in sync with
// mobile/src/assets/images/exercise-icons/*_anatomy.png. Each is a solid-black
// cutout with real alpha, meant to be tinted at render time (here via a CSS
// mask, matching the mobile app's Image `tintColor` approach) rather than a
// pre-colored asset, so the same file works for every muscle group's color.
import chest from "@/assets/muscle-icons/chest_anatomy.png";
import back from "@/assets/muscle-icons/upper_back_anatomy.png";
import shoulders from "@/assets/muscle-icons/shoulder_anatomy.png";
import triceps from "@/assets/muscle-icons/triceps_anatomy.png";
import core from "@/assets/muscle-icons/core_anatomy.png";
import quads from "@/assets/muscle-icons/quads_anatomy.png";
import hamstrings from "@/assets/muscle-icons/hamstrings_anatomy.png";
import glutes from "@/assets/muscle-icons/glutes_anatomy.png";
import calves from "@/assets/muscle-icons/calves_anatomy.png";
import fullBody from "@/assets/muscle-icons/fullbody_anatomy.png";

export const MUSCLE_ICON: Partial<Record<string, string>> = {
  CHEST: chest,
  BACK: back,
  SHOULDERS: shoulders,
  TRICEPS: triceps,
  CORE: core,
  QUADRICEPS: quads,
  HAMSTRINGS: hamstrings,
  GLUTES: glutes,
  CALVES: calves,
  FULL_BODY: fullBody,
  // BICEPS, FOREARMS, CARDIO, OTHER have no dedicated art yet — callers
  // should fall back to a generic icon when this map has no entry.
};

// Same palette as the mobile app's ExerciseListScreen MUSCLE_COLORS, so a
// muscle group reads the same color here as it does on-device.
export const MUSCLE_COLOR: Record<string, string> = {
  CHEST: "#EF4444",
  BACK: "#3B82F6",
  SHOULDERS: "#8B5CF6",
  BICEPS: "#06B6D4",
  TRICEPS: "#F59E0B",
  FOREARMS: "#F97316",
  CORE: "#EC4899",
  GLUTES: "#22C55E",
  QUADRICEPS: "#22C55E",
  HAMSTRINGS: "#22C55E",
  CALVES: "#22C55E",
  FULL_BODY: "#AAFF00",
  CARDIO: "#F97316",
  OTHER: "#6B6B6B",
};
