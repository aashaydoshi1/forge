import { createClient, SupabaseClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/config/env';
import type { Database } from '@/types/database';

import { secureStoreAdapter } from './storage';

let supabaseClient: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      env.EXPO_PUBLIC_SUPABASE_URL,
      env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          storage: secureStoreAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return supabaseClient;
}

/** Typed Supabase client — throws if env vars are missing. */
export function supabase(): SupabaseClient<Database> {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');
  return client;
}
