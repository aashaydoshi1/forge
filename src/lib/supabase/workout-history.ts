import type { Database } from '@/types/database';

import { getSupabase } from './client';

export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row'];
export type WorkoutSessionInsert = Database['public']['Tables']['workout_sessions']['Insert'];
export type CompletedSet = Database['public']['Tables']['completed_sets']['Row'];
export type CompletedSetInsert = Database['public']['Tables']['completed_sets']['Insert'];

export type FinishWorkoutSetInput = {
  exerciseId: string;
  weight: number | null;
  reps: number;
  setNumber: number;
};

export type FinishWorkoutInput = {
  userId: string;
  workoutPlanId: string;
  startedAt: string;
  completedAt?: string;
  sets: FinishWorkoutSetInput[];
};

export async function finishWorkout(input: FinishWorkoutInput): Promise<WorkoutSession> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const completedAt = input.completedAt ?? new Date().toISOString();

  const { data: session, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: input.userId,
      workout_plan_id: input.workoutPlanId,
      started_at: input.startedAt,
      completed_at: completedAt,
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  if (input.sets.length > 0) {
    const rows: CompletedSetInsert[] = input.sets.map((set) => ({
      session_id: session.id,
      exercise_id: set.exerciseId,
      weight: set.weight,
      reps: set.reps,
      set_number: set.setNumber,
    }));

    const { error: setsError } = await supabase.from('completed_sets').insert(rows);

    if (setsError) throw setsError;
  }

  return session;
}

export type WorkoutSessionHistoryItem = WorkoutSession & {
  workout_plans: { name: string } | null;
};

export type CompletedSetWithExercise = CompletedSet & {
  exercises: { exercise_name: string } | null;
};

export type WorkoutSessionDetails = WorkoutSessionHistoryItem & {
  completed_sets: CompletedSetWithExercise[];
};

/** Flattened completed-set row for personal-record calculations. */
export type PersonalRecordSet = {
  exerciseName: string;
  weight: number | null;
  reps: number;
  completedAt: string;
};

type PersonalRecordQueryRow = {
  weight: number | null;
  reps: number;
  exercises: { exercise_name: string } | null;
  workout_sessions: { completed_at: string | null; user_id: string } | null;
};

export async function fetchCompletedWorkoutSessions(
  userId: string,
): Promise<WorkoutSessionHistoryItem[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout_plans(name)')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WorkoutSessionHistoryItem[];
}

export async function fetchWorkoutSessionDetails(
  sessionId: string,
): Promise<WorkoutSessionDetails | null> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout_plans(name), completed_sets(*, exercises(exercise_name))')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const details = data as WorkoutSessionDetails;
  details.completed_sets = [...(details.completed_sets ?? [])].sort(
    (a, b) => a.set_number - b.set_number,
  );

  return details;
}

export async function deleteWorkoutSession(sessionId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.from('workout_sessions').delete().eq('id', sessionId);

  if (error) throw error;
}

export async function fetchPersonalRecords(userId: string): Promise<PersonalRecordSet[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('completed_sets')
    .select(
      'weight, reps, exercises(exercise_name), workout_sessions!inner(completed_at, user_id)',
    )
    .eq('workout_sessions.user_id', userId)
    .not('workout_sessions.completed_at', 'is', null);

  if (error) throw error;

  const rows = (data ?? []) as PersonalRecordQueryRow[];

  return rows.flatMap((row) => {
    const exerciseName = row.exercises?.exercise_name?.trim();
    const completedAt = row.workout_sessions?.completed_at;
    if (!exerciseName || !completedAt) return [];

    return [
      {
        exerciseName,
        weight: row.weight,
        reps: row.reps,
        completedAt,
      },
    ];
  });
}

export type PreviousSetPerformance = {
  exercise_id: string;
  weight: number | null;
  reps: number;
  set_number: number;
};

type LastWorkoutPerformanceRow = {
  completed_sets: PreviousSetPerformance[] | null;
};

export async function fetchLastWorkoutPerformance(
  userId: string,
  workoutPlanId: string,
): Promise<PreviousSetPerformance[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('completed_sets(exercise_id, weight, reps, set_number)')
    .eq('user_id', userId)
    .eq('workout_plan_id', workoutPlanId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return [];

  const sets = ((data as LastWorkoutPerformanceRow).completed_sets ?? []).slice();
  sets.sort((a, b) => a.set_number - b.set_number);
  return sets;
}
