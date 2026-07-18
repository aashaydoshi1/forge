import type { Database } from '@/types/database';

import { getSupabase } from './client';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export function isProfileComplete(profile: Profile | null): boolean {
  return !!profile?.name;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProfile(profile: ProfileInsert): Promise<Profile> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase.from('profiles').insert(profile).select().single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
