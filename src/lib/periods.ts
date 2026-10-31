export type Cadence = "daily" | "weekly";

const DAY = 86_400_000;

/**
 * Warframe resets at 00:00 UTC every day, and weekly content resets on
 * Monday 00:00 UTC (same moment Nightwave and Maroo's hunt refresh).
 * A checked task stores the start of the period it was ticked in, so it
 * automatically counts as "not done" as soon as the next period begins.
 */
export function periodStart(cadence: Cadence, now = Date.now()): number {
  const d = new Date(now);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (cadence === "daily") return day;
  const mondayBased = (new Date(day).getUTCDay() + 6) % 7; // Mon = 0 … Sun = 6
  return day - mondayBased * DAY;
}

export function nextReset(cadence: Cadence, now = Date.now()): number {
  return periodStart(cadence, now) + (cadence === "daily" ? DAY : 7 * DAY);
}
