import type { Database } from '@/types/database';

import { getSupabase } from './client';

export type WorkoutPlan = Database['public']['Tables']['workout_plans']['Row'];
export type WorkoutPlanInsert = Database['public']['Tables']['workout_plans']['Insert'];
export type Exercise = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];

export async function fetchWorkoutPlans(userId: string): Promise<WorkoutPlan[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchWorkoutPlan(planId: string): Promise<WorkoutPlan | null> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createWorkoutPlan(userId: string, name: string): Promise<WorkoutPlan> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Workout name is required');
  }

  const { data, error } = await supabase
    .from('workout_plans')
    .insert({
      user_id: userId,
      name: trimmedName,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkoutPlan(planId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.from('workout_plans').delete().eq('id', planId);

  if (error) throw error;
}

export async function fetchExercises(workoutPlanId: string): Promise<Exercise[]> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('workout_plan_id', workoutPlanId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createExercise(exercise: ExerciseInsert): Promise<Exercise> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.from('exercises').insert(exercise).select().single();

  if (error) throw error;
  return data;
}

export async function updateExercise(id: string, updates: ExerciseUpdate): Promise<Exercise> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { error } = await supabase.from('exercises').delete().eq('id', id);

  if (error) throw error;
}
