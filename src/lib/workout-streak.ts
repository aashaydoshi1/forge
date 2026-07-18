/** Schedule day_of_week: 0 = Monday … 6 = Sunday (matches workout_schedules). */
export function getScheduleDayOfWeek(date = new Date()): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDayKeyFromDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalDayKey(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return toLocalDayKeyFromDate(date);
}

export type StreakSession = {
  completed_at: string | null;
};

export type StreakScheduleDay = {
  day_of_week: number;
  workout_plan_id: string | null;
};

/**
 * Schedule-aware streak:
 * - Scheduled workout days need ≥1 completed workout (any plan) to continue.
 * - Rest days never break the streak and do not increment it.
 * - Today’s scheduled workout may still be pending without breaking the streak.
 */
export function calculateScheduleAwareStreak(
  sessions: StreakSession[],
  schedule: StreakScheduleDay[],
  now = new Date(),
): number {
  const completedDays = new Set<string>();
  for (const session of sessions) {
    if (!session.completed_at) continue;
    const key = toLocalDayKey(session.completed_at);
    if (key) completedDays.add(key);
  }

  const scheduledWorkoutDays = new Set<number>();
  for (const row of schedule) {
    if (row.workout_plan_id) {
      scheduledWorkoutDays.add(row.day_of_week);
    }
  }

  if (scheduledWorkoutDays.size === 0) return 0;

  let streak = 0;
  const cursor = startOfLocalDay(now);
  const maxLookbackDays = 730;

  for (let offset = 0; offset < maxLookbackDays; offset += 1) {
    const dayOfWeek = getScheduleDayOfWeek(cursor);
    const dayKey = toLocalDayKeyFromDate(cursor);
    const isScheduledWorkoutDay = scheduledWorkoutDays.has(dayOfWeek);

    if (!isScheduledWorkoutDay) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    if (completedDays.has(dayKey)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    // Today is still in progress — keep looking back without breaking.
    if (offset === 0) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}
