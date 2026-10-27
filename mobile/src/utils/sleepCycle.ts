import { subMinutes } from 'date-fns';

// Average sleep cycle length and the typical time it takes to fall asleep.
// Waking up at a cycle boundary (rather than mid-cycle, during deep sleep)
// is the whole premise of "sleep cycle" alarm apps like Sleep Cycle/Pillow.
const CYCLE_MINUTES = 90;
const FALL_ASLEEP_BUFFER_MINUTES = 14;

export interface BedtimeRecommendation {
  time: Date;
  cycles: number;
  totalSleepMinutes: number;
}

// Given a target wake time, returns bedtime options landing on whole
// sleep-cycle boundaries, best (most cycles) first.
export function recommendBedtimes(
  wakeTime: Date,
  cycleOptions: number[] = [6, 5, 4]
): BedtimeRecommendation[] {
  return cycleOptions.map((cycles) => {
    const totalSleepMinutes = cycles * CYCLE_MINUTES;
    const time = subMinutes(wakeTime, totalSleepMinutes + FALL_ASLEEP_BUFFER_MINUTES);
    return { time, cycles, totalSleepMinutes };
  });
}
