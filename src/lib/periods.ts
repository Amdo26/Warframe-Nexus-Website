export type Cadence = "daily" | "weekly";

/**
 * Most things reset at 00:00 UTC. "sortie" is the exception: the Sortie
 * changes at 12:00 New York time (16:00 UTC in US summer time, otherwise 17:00 UTC).
 */
export type ResetRule = "utc" | "sortie";

const DAY = 86_400_000;
const HOUR = 3_600_000;

/** The 12:00 New York moment that falls on the given UTC calendar day. */
function sortieResetOn(dayStartMs: number): number {
  const at16 = dayStartMs + 16 * HOUR;
  const nyHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(at16)),
  );
  return nyHour === 12 ? at16 : dayStartMs + 17 * HOUR;
}

/**
 * Warframe resets at 00:00 UTC every day, and weekly content resets on
 * Monday 00:00 UTC (same moment Nightwave and Maroo's hunt refresh).
 * A checked task stores the start of the period it was ticked in, so it
 * automatically counts as "not done" as soon as the next period begins.
 */
export function periodStart(cadence: Cadence, now = Date.now(), rule: ResetRule = "utc"): number {
  const d = new Date(now);
  const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (cadence === "daily") {
    if (rule === "sortie") {
      const today = sortieResetOn(day);
      return today <= now ? today : sortieResetOn(day - DAY);
    }
    return day;
  }
  const mondayBased = (new Date(day).getUTCDay() + 6) % 7; // Mon = 0 … Sun = 6
  return day - mondayBased * DAY;
}

export function nextReset(cadence: Cadence, now = Date.now()): number {
  return periodStart(cadence, now) + (cadence === "daily" ? DAY : 7 * DAY);
}
