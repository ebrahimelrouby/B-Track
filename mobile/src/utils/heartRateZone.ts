// Simple, generic effort labels — not personalized to the user's actual max
// HR (the app doesn't collect that), just a plain-language read on the bpm itself.
export interface HeartRateZone {
  label: string;
  color: string;
}

const ZONE_EASY:     HeartRateZone = { label: 'Easy',     color: '#22C55E' };
const ZONE_MODERATE: HeartRateZone = { label: 'Moderate', color: '#F59E0B' };
const ZONE_HARD:     HeartRateZone = { label: 'Hard',     color: '#EF4444' };

export function hrZone(bpm: number): HeartRateZone {
  if (bpm < 120) return ZONE_EASY;
  if (bpm < 150) return ZONE_MODERATE;
  return ZONE_HARD;
}
