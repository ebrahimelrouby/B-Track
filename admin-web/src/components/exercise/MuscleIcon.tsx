import { Dumbbell } from "lucide-react";
import { MUSCLE_ICON, MUSCLE_COLOR } from "@/lib/muscleIcons";

export default function MuscleIcon({ muscleGroup, size = 28 }: { muscleGroup?: string; size?: number }) {
  const color = MUSCLE_COLOR[muscleGroup ?? ""] ?? MUSCLE_COLOR.OTHER;
  const icon = muscleGroup ? MUSCLE_ICON[muscleGroup] : undefined;

  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{ width: size + 12, height: size + 12, backgroundColor: color + "18" }}
    >
      {icon ? (
        <div
          role="img"
          aria-label={muscleGroup}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
            WebkitMaskImage: `url(${icon})`,
            maskImage: `url(${icon})`,
            WebkitMaskSize: "contain",
            maskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            maskPosition: "center",
          }}
        />
      ) : (
        <Dumbbell size={size * 0.6} color={color} />
      )}
    </div>
  );
}
