import type { Database } from '@/types/database';

import { getSupabase } from './client';

export type WorkoutSchedule = Database['public']['Tables']['workout_schedules']['Row'];
export type WorkoutScheduleInsert = Database['public']['Tables']['workout_schedules']['Insert'];

export type WorkoutScheduleWithPlan = WorkoutSchedule & {
  workout_plans: { id: string; name: string } | null;
};

/** 0 = Monday … 6 = Sunday */
export const WEEK_DAYS = [
  { value: 0, label: 'Monday', short: 'Mon' },
  { value: 1, label: 'Tuesday', short: 'Tue' },
  { value: 2, label: 'Wednesday', short: 'Wed' },
  { value: 3, label: 'Thursday', short: 'Thu' },
  { value: 4, label: 'Friday', short: 'Fri' },
  { value: 5, label: 'Saturday', short: 'Sat' },
  { value: 6, label: 'Sunday', short: 'Sun' },
] as const;

export async function fetchWorkoutSchedule(userId: string): Promise<WorkoutScheduleWithPlan[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('workout_schedules')
    .select('*, workout_plans(id, name)')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkoutScheduleWithPlan[];
}

export async function upsertWorkoutScheduleDay(
  userId: string,
  dayOfWeek: number,
  workoutPlanId: string | null,
): Promise<WorkoutScheduleWithPlan> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error('day_of_week must be between 0 and 6');
  }

  const { data, error } = await supabase
    .from('workout_schedules')
    .upsert(
      {
        user_id: userId,
        day_of_week: dayOfWeek,
        workout_plan_id: workoutPlanId,
      },
      { onConflict: 'user_id,day_of_week' },
    )
    .select('*, workout_plans(id, name)')
    .single();

  if (error) throw error;
  return data as WorkoutScheduleWithPlan;
}
