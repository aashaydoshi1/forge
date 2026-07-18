import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  EXPO_PUBLIC_EMAIL_REDIRECT_URL: z.url().optional(),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_EMAIL_REDIRECT_URL: process.env.EXPO_PUBLIC_EMAIL_REDIRECT_URL || undefined,
});

export const isSupabaseConfigured = parsed.success;

export const env = parsed.success
  ? parsed.data
  : {
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
      EXPO_PUBLIC_EMAIL_REDIRECT_URL: undefined as string | undefined,
    };

/**
 * Where Supabase sends users after they click the email confirmation link.
 * Prefer the in-app deep link so no web session is created.
 * Override with EXPO_PUBLIC_EMAIL_REDIRECT_URL to use a hosted HTTPS page.
 */
export function getEmailVerifiedRedirectUrl(): string {
  if (env.EXPO_PUBLIC_EMAIL_REDIRECT_URL) {
    return env.EXPO_PUBLIC_EMAIL_REDIRECT_URL;
  }

  return 'forge://email-verified';
}
