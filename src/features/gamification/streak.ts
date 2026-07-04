export type Streak = { lastDay: number; length: number; longest: number };
const dayMilliseconds = 86_400_000;

/** Calendar day in the device timezone, encoded as an integer for DST-safe comparisons. */
export function localDay(date: Date) {
  if (!Number.isFinite(date.getTime())) return;
  const utcDate = new Date(0);
  utcDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(utcDate.getTime() / dayMilliseconds);
}

export function recordStreak(
  previous: Streak | undefined,
  date: Date,
): Streak | undefined {
  const day = localDay(date);
  if (day === undefined || (previous && day <= previous.lastDay))
    return previous;

  const length =
    previous && day === previous.lastDay + 1 ? previous.length + 1 : 1;
  return {
    lastDay: day,
    length,
    longest: Math.max(length, previous?.longest ?? 0),
  };
}

export function activeStreak(streak: Streak | undefined, date: Date) {
  const day = localDay(date);
  if (!streak || day === undefined) return 0;
  return day <= streak.lastDay + 1 ? streak.length : 0;
}
